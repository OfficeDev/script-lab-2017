using Newtonsoft.Json;

namespace OfficeJsSnippetsService.Controllers
{
    public class SnippetInfoWithKeyDto : SnippetInfoDto
    {
        [JsonProperty("key")]
        public string Key { get; set; }
    }
}