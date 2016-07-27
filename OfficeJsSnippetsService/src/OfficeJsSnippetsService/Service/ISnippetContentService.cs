using System.Threading.Tasks;

namespace OfficeJsSnippetsService.Service
{
    public interface ISnippetContentService
    {
        Task CreateContainerAsync(string snippetId);

        Task<string> GetContentAsync(string snippetId, string fileName);

        Task SetContentAsync(string snippetId, string fileName, string content);
    }
}