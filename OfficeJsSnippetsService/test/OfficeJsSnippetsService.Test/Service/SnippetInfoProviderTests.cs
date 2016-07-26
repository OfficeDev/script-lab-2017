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
    public class SnippetInfoProviderTests
    {
        private readonly Mock<ITableStorageService> tableServiceMock;
        private readonly SnippetInfoProvider infoProvider;

        public SnippetInfoProviderTests()
        {
            this.tableServiceMock = new Mock<ITableStorageService>(MockBehavior.Strict);
            this.infoProvider = new SnippetInfoProvider(this.tableServiceMock.Object);
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
            SnippetInfoEntity actual = await this.infoProvider.GetSnippetInfoAsync("abc123");

            // Assert
            Assert.Equal(expected, actual);
        }
    }
}
