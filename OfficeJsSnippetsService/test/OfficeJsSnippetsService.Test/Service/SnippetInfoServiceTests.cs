using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Moq;
using OfficeJsSnippetsService.DataModel;
using OfficeJsSnippetsService.Service;
using Xunit;

namespace OfficeJsSnippetsService.Tests
{
    public class SnippetInfoServiceTests
    {
        private readonly Mock<ITableStorageService> tableServiceMock;
        private readonly SnippetInfoService snippetInfoService;

        public SnippetInfoServiceTests()
        {
            this.tableServiceMock = new Mock<ITableStorageService>(MockBehavior.Strict);
            this.snippetInfoService = new SnippetInfoService(this.tableServiceMock.Object);
        }

        [Fact]
        public async Task GetContentAsync_Works()
        {
            // Arrange
            var expected = new SnippetInfoEntity
            {
                PartitionKey = "abc123",
                Name = "My snippet name"
            };
            this.tableServiceMock
                .Setup(b => b.QueryAsync<SnippetInfoEntity>("snippets", "(PartitionKey eq 'abc123') and (RowKey eq '1')", null))
                .ReturnsAsync(new[] { expected });

            // Act
            SnippetInfoEntity actual = await this.snippetInfoService.GetSnippetInfoAsync("abc123");

            // Assert
            Assert.Equal(expected, actual);
        }

        [Fact]
        public async Task CreateSnippetAsync_Works()
        {
            // Arrange
            SnippetInfoEntity entity = SnippetInfoEntity.Create("abc123");
            this.tableServiceMock
                .Setup(b => b.InsertAsync("snippets", entity))
                .Returns(Task.FromResult(0));

            // Act
            await this.snippetInfoService.CreateSnippetAsync(entity);
        }
    }
}
