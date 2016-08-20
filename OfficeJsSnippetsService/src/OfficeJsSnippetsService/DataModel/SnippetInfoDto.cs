using Newtonsoft.Json;

namespace OfficeJsSnippetsService.Controllers
{
    public class SnippetInfoDto
    {
        [JsonProperty("id")]
        public string Id { get; set; }

        [JsonProperty("name", DefaultValueHandling = DefaultValueHandling.Ignore)]
        public string Name { get; set; }

        [JsonProperty("hosts")]
        public string Hosts { get; set; }

        [JsonProperty("metadataVersion")]
        public double MetadataVersion { get; set; }

        [JsonProperty("contains")]
        public string Contains{ get; set; }
    }
}