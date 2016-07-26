using System.Threading.Tasks;

namespace OfficeJsApiPlayground.Service
{
    public interface IBlobService
    {
        Task<string> DownloadBlobAsync(string containerName, string blobName);
    }
}