using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using OfficeJsSnippetsService.Common;

namespace OfficeJsSnippetsService.Service
{
    public class SnippetContentService : ISnippetContentService
    {
        private const string ContainerNameTemplate = "snippet-{0}";

        private readonly IBlobService blobProvider;

        public SnippetContentService(IBlobService blobProvider)
        {
            Ensure.ArgumentNotNull(blobProvider, nameof(blobProvider));
            this.blobProvider = blobProvider;
        }

        public async Task<string> GetContentAsync(string snippetId, string fileName)
        {
            return await this.blobProvider.DownloadBlobAsync(
                containerName: GetContainerName(snippetId),
                blobName: fileName);
        }

        public async Task CreateContainerAsync(string snippetId)
        {
            await this.blobProvider.CreateContainerIfNotExistsAsync(
                containerName: GetContainerName(snippetId));
        }

        public async Task SetContentAsync(string snippetId, string fileName, string content)
        {
            await this.blobProvider.UploadOrReplaceBlobAsync(
                containerName: GetContainerName(snippetId),
                blobName: fileName,
                content: content);
        }

        public async Task DeleteContentIfExistsAsync(string snippetId, string fileName)
        {
            await this.blobProvider.DeleteBlobIfExistsAsync(
                containerName: GetContainerName(snippetId),
                blobName: fileName);
        }

        private static string GetContainerName(string snippetId)
        {
            return ContainerNameTemplate.FormatInvariant(snippetId);
        }
    }
}