using System.Net.Http;
using OfficeJsSnippetsService.DataModel;

namespace OfficeJsSnippetsService.Service
{
    public interface IPasswordValidator
    {
        void ValidatePasswordOrThrow(HttpRequestMessage request, SnippetInfoEntity entity);
    }
}