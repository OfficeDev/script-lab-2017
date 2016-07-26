using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Auth;
using Microsoft.WindowsAzure.Storage.Blob;
using OfficeJsApiPlayground.Common;

namespace OfficeJsApiPlayground.Service
{
    public class BlobService : IBlobService
    {
        private readonly ServiceConfig config;
        private readonly CloudBlobClient blobClient;
        private readonly Encoding encoding;

        public BlobService(ServiceConfigProvider configProvider)
        {
            Ensure.ArgumentNotNull(configProvider, nameof(configProvider));
            this.config = configProvider.GetConfig();

            CloudStorageAccount account = CloudStorageAccount.Parse(this.config.BlobConnectionString);
            this.blobClient = account.CreateCloudBlobClient();

            this.encoding = new UTF8Encoding(encoderShouldEmitUTF8Identifier: false);
        }

        public async Task<string> DownloadBlobAsync(string containerName, string blobName)
        {
            CloudBlobContainer container = this.blobClient.GetContainerReference(containerName);
            CloudBlob blob = container.GetBlobReference(blobName);

            try
            {
                using (var ms = new MemoryStream())
                {
                    await blob.DownloadToStreamAsync(ms);
                    ms.Seek(0, SeekOrigin.Begin);
                    using (var sr = new StreamReader(ms, this.encoding))
                    {
                        string contents = await sr.ReadToEndAsync();
                        return contents;
                    }
                }
            }
            catch (StorageException ex)
            {
                if (ex.RequestInformation?.HttpStatusCode == (int)HttpStatusCode.NotFound)
                {
                    throw new MyWebException(HttpStatusCode.NotFound, "File does not exist");
                }

                throw new MyWebException(HttpStatusCode.BadGateway, "An error occurred while processing a request from an upstream server. Please try again in a few minutes.");
            }
        }
    }
}