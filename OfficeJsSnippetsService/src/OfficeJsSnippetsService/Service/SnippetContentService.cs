using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using OfficeJsSnippetsService.Common;

namespace OfficeJsSnippetsService.Service
{
    public class SnippetContentService
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

        private static string GetContainerName(string snippetId)
        {
            return ContainerNameTemplate.FormatInvariant(snippetId);
        }
    }
}