using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using Moq;
using OfficeJsSnippetsService.Common;
using OfficeJsSnippetsService.Controllers;
using OfficeJsSnippetsService.DataModel;
using OfficeJsSnippetsService.Service;
using Xunit;

namespace OfficeJsSnippetsService.Test.Controllers
{
    public class SnippetsControllerTests
    {
        private const string TestSnippetId = "abc123";

        private readonly Mock<ISnippetInfoService> snippetInfoServiceMock;
        private readonly Mock<ISnippetContentService> snippetContentServiceMock;
        private readonly Mock<IIdGenerator> idGeneratorMock;
        private readonly Mock<IPasswordHelper> passwordHelperMock;
        private readonly Mock<IPasswordValidator> passwordValidatorMock;
        private readonly Mock<ISnippetZipService> zipService;

        private readonly SnippetsController controller;

        public SnippetsControllerTests()
        {
            this.snippetInfoServiceMock = new Mock<ISnippetInfoService>(MockBehavior.Strict);
            this.snippetContentServiceMock = new Mock<ISnippetContentService>(MockBehavior.Strict);
            this.idGeneratorMock = new Mock<IIdGenerator>(MockBehavior.Strict);
            this.passwordHelperMock = new Mock<IPasswordHelper>(MockBehavior.Strict);
            this.passwordValidatorMock = new Mock<IPasswordValidator>(MockBehavior.Strict);
            this.zipService = new Mock<ISnippetZipService>(MockBehavior.Strict);

            this.controller = new SnippetsController(
                this.snippetInfoServiceMock.Object,
                this.snippetContentServiceMock.Object,
                this.idGeneratorMock.Object,
                this.passwordHelperMock.Object,
                this.passwordValidatorMock.Object,
                this.zipService.Object);
        }

        [Fact]
        public async Task GetSnippetInfo_Succeeds()
        {
            // Arrange
            var entity = new SnippetInfoEntity
            {
                PartitionKey = TestSnippetId,
                Name = "test name"
            };
            this.snippetInfoServiceMock.Setup(s => s.GetSnippetInfoAsync(TestSnippetId))
                .ReturnsAsync(entity);

            // Act
            SnippetInfoDto actual = await this.controller.GetSnippetInfo(TestSnippetId);

            // Assert
            Assert.Equal(TestSnippetId, actual.Id);
            Assert.Equal("test name", actual.Name);
        }

        [Fact]
        public async Task GetSnippetInfo_Throws404_SnippetDoesNotExist()
        {
            // Arrange
            this.snippetInfoServiceMock.Setup(s => s.GetSnippetInfoAsync(TestSnippetId))
                .ReturnsAsync(null);

            // Act
            var ex = await Assert.ThrowsAsync<MyWebException>(async () => await this.controller.GetSnippetInfo(TestSnippetId));

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, ex.StatusCode);
        }
    }
}
