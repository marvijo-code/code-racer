using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Pomelo.EntityFrameworkCore.MySql.Infrastructure;

namespace Backend.Data
{
    public class GameDbContextFactory : IDesignTimeDbContextFactory<GameDbContext>
    {
        public GameDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<GameDbContext>();
            
            // Use a dummy connection string for design time
            optionsBuilder.UseMySql(
                "Server=localhost;Database=coderacer;User=root;Password=dummy;",
                ServerVersion.Parse("8.0.0-mysql"));

            return new GameDbContext(optionsBuilder.Options);
        }
    }
} 