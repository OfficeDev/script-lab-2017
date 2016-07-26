using Newtonsoft.Json;

namespace OfficeJsSnippetsService.Controllers
{
    public class SnippetInfoWithPasswordDto : SnippetInfoDto
    {
        [JsonProperty("password")]
        public string Password { get; set; }
    }
}