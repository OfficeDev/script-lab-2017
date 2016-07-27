using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Moq;
using OfficeJsSnippetsService.Service;
using Xunit;

namespace OfficeJsSnippetsService.Tests
{
    public class SnippetContentServiceTests
    {
        private readonly Mock<IBlobService> blobServiceMock;
        private readonly SnippetContentService snippetContentService;

        public SnippetContentServiceTests()
        {
            this.blobServiceMock = new Mock<IBlobService>(MockBehavior.Strict);
            this.snippetContentService = new SnippetContentService(this.blobServiceMock.Object);
        }

        [Fact]
        public async Task GetContentAsync_Works()
        {
            const string TestContent = "test content";

            // Arrange
            this.blobServiceMock
                .Setup(b => b.DownloadBlobAsync("snippet-abc123", "myFile"))
                .ReturnsAsync(TestContent);

            // Act
            string actual = await this.snippetContentService.GetContentAsync("abc123", "myFile");

            // Assert
            Assert.Equal(TestContent, actual);
        }
    }
}
