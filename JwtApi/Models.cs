using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace JwtApi;

public class ApplicationUser : IdentityUser {}

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}
    public DbSet<Student> Students => Set<Student>();
    public DbSet<Teacher> Teachers => Set<Teacher>();
}

public class Student
{
    public int Id { get; set; }
    public string stName { get; set; } = string.Empty;
    public string stAddress { get; set; } = string.Empty;
}

public class Teacher
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
}

public record SignupDto(string Username, string Email, string Password, string Role);
public record LoginDto(string Username, string Password);
