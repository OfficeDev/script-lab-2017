using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Moq;
using OfficeJsApiPlayground.Service;
using Xunit;

namespace OfficeJsApiPlayground.Tests
{
    public class SnippetContentProviderTests
    {
        private readonly Mock<IBlobService> blobServiceMock;
        private readonly SnippetContentProvider contentProvider;

        public SnippetContentProviderTests()
        {
            this.blobServiceMock = new Mock<IBlobService>(MockBehavior.Strict);
            this.contentProvider = new SnippetContentProvider(this.blobServiceMock.Object);
        }

        [Fact]
        public async Task GetContentAsync_Works()
        {
            const string TestContent = "test content";

            // Arrange
            this.blobServiceMock
                .Setup(b => b.DownloadBlobAsync("snippetabc123", "myFile"))
                .ReturnsAsync(TestContent);

            // Act
            string actual = await this.contentProvider.GetContentAsync("abc123", "myFile");

            // Assert
            Assert.Equal(TestContent, actual);
        }
    }
}
