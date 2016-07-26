using Newtonsoft.Json;

namespace OfficeJsApiPlayground.Controllers
{
    public class SnippetInfoDto
    {
        [JsonProperty("id")]
        public string Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }
    }
}