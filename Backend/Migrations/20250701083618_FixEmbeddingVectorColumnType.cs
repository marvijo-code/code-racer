using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class FixEmbeddingVectorColumnType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "EmbeddingVector",
                table: "Questions",
                type: "TEXT",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "REAL[]");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "EmbeddingVector",
                table: "Questions",
                type: "REAL[]",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "TEXT");
        }
    }
}
