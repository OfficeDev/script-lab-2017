using System.Threading.Tasks;

namespace OfficeJsSnippetsService.Service
{
    public interface IBlobService
    {
        Task<string> DownloadBlobAsync(string containerName, string blobName);
    }
}