using System.IO;
using System.Threading.Tasks;

namespace OfficeJsSnippetsService.Service
{
    public interface ISnippetZipService
    {
        Task ZipToStreamAsync(string snippetId, Stream stream);
    }
}