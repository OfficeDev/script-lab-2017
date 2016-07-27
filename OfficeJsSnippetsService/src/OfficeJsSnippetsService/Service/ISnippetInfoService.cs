using System.Threading.Tasks;
using OfficeJsSnippetsService.DataModel;

namespace OfficeJsSnippetsService.Service
{
    public interface ISnippetInfoService
    {
        Task CreateSnippetAsync(SnippetInfoEntity entity);

        Task<SnippetInfoEntity> GetSnippetInfoAsync(string snippetId);

        Task SetSnippetInfoAsync(SnippetInfoEntity entity);
    }
}