using JwtApi;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

var builder = WebApplication.CreateBuilder(args);
var cfg = builder.Configuration;
var services = builder.Services;

// -----------------------------
// EF Core + Identity (SQL Server)
// -----------------------------
services.AddDbContext<AppDbContext>(o =>
    o.UseSqlServer(cfg.GetConnectionString("DefaultConnection")));

services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

// -----------------------------
// JWT (for API controllers)
// -----------------------------
var jwt = cfg.GetSection("Jwt");
var jwtKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!));

services.AddAuthentication(o =>
{
    o.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    o.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(o =>
{
    o.RequireHttpsMetadata = true;
    o.SaveToken = false;
    o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwt["Issuer"],
        ValidateAudience = true,
        ValidAudience = jwt["Audience"],
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = jwtKey,
        ValidateLifetime = true,
        NameClaimType = ClaimTypes.Name,
        RoleClaimType = ClaimTypes.Role,
        ClockSkew = TimeSpan.FromMinutes(1)
    };
});

services.AddAuthorization();
services.AddControllers();

// -----------------------------
// Swagger
// -----------------------------
services.AddEndpointsApiExplorer();
services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "JwtApi+BFF", Version = "v1" });
    var jwtSecurityScheme = new OpenApiSecurityScheme
    {
        Scheme = "bearer",
        BearerFormat = "JWT",
        Name = "JWT Authentication",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Description = "Put ONLY your JWT token here (without 'Bearer ' prefix).",
        Reference = new OpenApiReference { Id = "Bearer", Type = ReferenceType.SecurityScheme }
    };
    c.AddSecurityDefinition("Bearer", jwtSecurityScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement { { jwtSecurityScheme, Array.Empty<string>() } });
});

// -----------------------------
// BFF infrastructure (merged)
// -----------------------------
services.AddDistributedMemoryCache();
services.AddSession(o =>
{
    o.Cookie.HttpOnly = true;                 // not readable by JS
    o.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    o.Cookie.SameSite = SameSiteMode.None;    // allow React dev (cross-site)
    o.IdleTimeout = TimeSpan.FromHours(8);
});

builder.Services.AddAntiforgery(options => // ok ok : postman login + students post ok https
{
    options.HeaderName = "X-CSRF";
    options.Cookie.Name = "bff-csrf";
    options.Cookie.SameSite = SameSiteMode.Lax; // Changed from Strict to Lax
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    options.Cookie.HttpOnly = true; // Should be true for security
    options.Cookie.Path = "/bff"; // Scope cookie to BFF routes only
});

// CORS for React dev server
services.AddCors(o =>
{
    o.AddPolicy("react", p => p
        .WithOrigins("http://localhost:5173", "https://localhost:5173")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
});

// For proxying back into ourselves (BFF -> API)
services.AddHttpClient("self");

var app = builder.Build();

// -----------------------------
// Seed database: roles, users, demo data
// -----------------------------
using (var scope = app.Services.CreateScope())
{
    var sp = scope.ServiceProvider;
    var db = sp.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();

    var roleMgr = sp.GetRequiredService<RoleManager<IdentityRole>>();
    async Task EnsureRole(string r) { if (!await roleMgr.RoleExistsAsync(r)) await roleMgr.CreateAsync(new IdentityRole(r)); }
    await EnsureRole("AdminRole");
    await EnsureRole("StudentRole");

    var userMgr = sp.GetRequiredService<UserManager<ApplicationUser>>();
    async Task EnsureUser(string u, string p, string role)
    {
        var user = await userMgr.FindByNameAsync(u);
        if (user is null)
        {
            user = new ApplicationUser { UserName = u, Email = $"{u}@local" };
            await userMgr.CreateAsync(user, p);
            await userMgr.AddToRoleAsync(user, role);
        }
    }
    await EnsureUser("admin", "Admin123!", "AdminRole");
    await EnsureUser("student", "Student123!", "StudentRole");

    if (!db.Students.Any())
        db.Students.AddRange(
            new Student { stName = "Alice", stAddress = "Street 1" },
            new Student { stName = "Bob", stAddress = "Street 2" }
        );

    if (!db.Teachers.Any())
        db.Teachers.AddRange(
            new Teacher { Name = "Dr Smith", Address = "A" },
            new Teacher { Name = "Prof Jones", Address = "B" }
        );

    db.SaveChanges();
}

// -----------------------------
// Middleware order (important)
// -----------------------------
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("react");
app.UseSession();

app.Use(async (ctx, next) =>
{
    var m = ctx.Request.Method;
    var p = ctx.Request.Path;
    bool isBff = p.StartsWithSegments("/bff", StringComparison.OrdinalIgnoreCase);
    bool isUnsafe = HttpMethods.IsPost(m) || HttpMethods.IsPut(m) || HttpMethods.IsDelete(m);

    if (isBff && isUnsafe &&
        !p.StartsWithSegments("/bff/login", StringComparison.OrdinalIgnoreCase) &&
        !p.StartsWithSegments("/bff/logout", StringComparison.OrdinalIgnoreCase) &&
        !p.StartsWithSegments("/bff/csrf", StringComparison.OrdinalIgnoreCase))
    {
        var sessionCsrf = ctx.Session.GetString("CSRF-Token");
        var headerCsrf = ctx.Request.Headers["X-CSRF"].FirstOrDefault();
        if (string.IsNullOrEmpty(headerCsrf) || headerCsrf != sessionCsrf)
        {
            ctx.Response.StatusCode = 400;
            await ctx.Response.WriteAsync("Invalid CSRF token");
            return;
        }
    }
    await next();
});


app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// -----------------------------
// BFF helpers
// -----------------------------
string ApiBase(HttpContext ctx) => $"{ctx.Request.Scheme}://{ctx.Request.Host}";
bool HasToken(HttpContext c) => c.Session.TryGetValue("AuthToken", out _);
string? GetToken(HttpContext c) => c.Session.TryGetValue("AuthToken", out var b) ? Encoding.UTF8.GetString(b) : null;
void SetToken(HttpContext c, string token) => c.Session.Set("AuthToken", Encoding.UTF8.GetBytes(token));
void ClearToken(HttpContext c) => c.Session.Remove("AuthToken");

async Task<IResult> ProxyTo(HttpContext ctx, string pathAndQuery)
{
    if (!HasToken(ctx)) return Results.Unauthorized();

    var client = app.Services.GetRequiredService<IHttpClientFactory>().CreateClient("self");
    var target = $"{ApiBase(ctx)}{pathAndQuery}";
    var req = new HttpRequestMessage(new HttpMethod(ctx.Request.Method), target);

    ctx.Request.EnableBuffering();
    if (ctx.Request.ContentLength is > 0)
    {
        using var sr = new StreamReader(ctx.Request.Body, Encoding.UTF8, leaveOpen: true);
        var body = await sr.ReadToEndAsync();
        ctx.Request.Body.Position = 0;
        req.Content = new StringContent(body, Encoding.UTF8, ctx.Request.ContentType ?? "application/json");
    }

    var token = GetToken(ctx);
    req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

    using var resp = await client.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, ctx.RequestAborted);
    ctx.Response.StatusCode = (int)resp.StatusCode;
    foreach (var h in resp.Headers) ctx.Response.Headers[h.Key] = h.Value.ToArray();
    foreach (var h in resp.Content.Headers) ctx.Response.Headers[h.Key] = h.Value.ToArray();
    ctx.Response.Headers.Remove("transfer-encoding");
    await resp.Content.CopyToAsync(ctx.Response.Body, ctx.RequestAborted);
    return Results.Empty;
}

// -----------------------------
// BFF endpoints
// -----------------------------
// Updated CSRF endpoint for session-based tokens
app.MapGet("/bff/csrf", (HttpContext ctx) =>
{
    // Generate a simple random token for session
    var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
    ctx.Session.SetString("CSRF-Token", token);

    Console.WriteLine($"Generated session CSRF token for user: {ctx.User?.Identity?.Name ?? "anonymous"}");

    return Results.Ok(new
    {
        token = token,
        method = "session-based",
        userId = ctx.User?.Identity?.Name ?? "anonymous"
    });
})
.DisableAntiforgery();

// 2) (Optional) whoami for UI header
app.MapGet("/bff/whoami", (HttpContext ctx) =>
{
    var tok = GetToken(ctx);
    if (string.IsNullOrEmpty(tok)) return Results.Unauthorized();

    var handler = new JwtSecurityTokenHandler();
    JwtSecurityToken? jwtToken = null;
    try { jwtToken = handler.ReadJwtToken(tok); } catch { }
    var name = jwtToken?.Claims.FirstOrDefault(c =>
                    c.Type == ClaimTypes.Name || c.Type == "unique_name" || c.Type == "name")?.Value;
    var roles = jwtToken?.Claims.Where(c => c.Type == ClaimTypes.Role || c.Type == "role")
                                .Select(c => c.Value).ToArray() ?? Array.Empty<string>();
    return Results.Ok(new { authenticated = true, name, roles });
});

app.MapGet("/bff/debug/claims", (HttpContext ctx) =>
{
    var claims = ctx.User?.Claims?.Select(c => new { c.Type, c.Value }).ToArray() ?? Array.Empty<object>();
    var userName = ctx.User?.Identity?.Name ?? "anonymous";
    var isAuth = ctx.User?.Identity?.IsAuthenticated ?? false;

    return Results.Ok(new
    {
        userName,
        isAuthenticated = isAuth,
        claimsCount = claims.Length,
        claims = claims,
        sessionId = ctx.Session.Id,
        csrfCookie = ctx.Request.Cookies["bff-csrf"]?.Length,
        csrfHeader = ctx.Request.Headers["X-CSRF"].FirstOrDefault()?.Length
    });
});

// 3) Login: call API /api/auth/login and store JWT in server session
app.MapPost("/bff/login", async (HttpContext ctx) =>
{
    using var sr = new StreamReader(ctx.Request.Body, Encoding.UTF8);
    var body = await sr.ReadToEndAsync();
    if (string.IsNullOrWhiteSpace(body)) return Results.BadRequest();

    using var doc = JsonDocument.Parse(body);
    if (!doc.RootElement.TryGetProperty("username", out var u) ||
        !doc.RootElement.TryGetProperty("password", out var p))
        return Results.BadRequest(new { error = "username/password required" });

    var username = u.GetString();
    var password = p.GetString();

    var client = app.Services.GetRequiredService<IHttpClientFactory>().CreateClient("self");
    var req = new HttpRequestMessage(HttpMethod.Post, $"{ApiBase(ctx)}/api/auth/login")
    {
        Content = new StringContent(JsonSerializer.Serialize(new { username, password }), Encoding.UTF8, "application/json")
    };

    using var resp = await client.SendAsync(req, ctx.RequestAborted);
    if (!resp.IsSuccessStatusCode) return Results.StatusCode((int)resp.StatusCode);

    var txt = await resp.Content.ReadAsStringAsync(ctx.RequestAborted);
    using var tokenDoc = JsonDocument.Parse(txt);
    if (!tokenDoc.RootElement.TryGetProperty("token", out var tokenProp))
        return Results.Unauthorized();

    var token = tokenProp.GetString();
    if (string.IsNullOrEmpty(token)) return Results.Unauthorized();

    SetToken(ctx, token);
    return Results.Ok(new { ok = true });
});

// 4) Logout: clear server-side token
app.MapPost("/bff/logout", (HttpContext ctx) =>
{
    ClearToken(ctx);
    return Results.Ok(new { ok = true });
});

// 5) Proxies (students/teachers) — JWT attached server-side
app.MapMethods("/bff/students", new[] { "GET", "POST" }, (HttpContext ctx) => ProxyTo(ctx, "/api/students"));
app.MapMethods("/bff/students/{id:int}", new[] { "GET", "PUT", "DELETE" }, (HttpContext ctx, int id) => ProxyTo(ctx, $"/api/students/{id}"));

app.MapMethods("/bff/teachers", new[] { "GET", "POST" }, (HttpContext ctx) => ProxyTo(ctx, "/api/teachers"));
app.MapMethods("/bff/teachers/{id:int}", new[] { "GET", "PUT", "DELETE" }, (HttpContext ctx, int id) => ProxyTo(ctx, $"/api/teachers/{id}"));

// Health
app.MapGet("/", () => "Merged API+BFF with CSRF is running.");

app.Run();
