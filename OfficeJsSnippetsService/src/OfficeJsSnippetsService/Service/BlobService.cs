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
using OfficeJsSnippetsService.Common;

namespace OfficeJsSnippetsService.Service
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
                    throw new MyWebException(HttpStatusCode.NotFound, "File does not exist", ex);
                }

                throw new MyWebException(HttpStatusCode.BadGateway, "Upstream server responded with an error. Please try again in a few minutes.", ex);
            }
        }

        public async Task CreateContainerIfNotExistsAsync(string containerName)
        {
            CloudBlobContainer container = this.blobClient.GetContainerReference(containerName);

            try
            {
                await container.CreateIfNotExistsAsync();
            }
            catch (StorageException ex)
            {
                throw new MyWebException(HttpStatusCode.BadGateway, "Upstream server responded with an error. Please try again in a few minutes.", ex);
            }
        }

        public async Task UploadOrReplaceBlobAsync(string containerName, string blobName, string content)
        {
            CloudBlobContainer container = this.blobClient.GetContainerReference(containerName);
            CloudBlockBlob blob = container.GetBlockBlobReference(blobName);

            try
            {
                using (var ms = new MemoryStream())
                {
                    byte[] bytes = this.encoding.GetBytes(content);
                    // TODO: Deal with etags / sequence numbers and handle OC properly
                    await blob.UploadFromByteArrayAsync(bytes, 0, bytes.Length);
                }
            }
            catch (StorageException ex)
            {
                throw new MyWebException(HttpStatusCode.BadGateway, "Upstream server responded with an error. Please try again in a few minutes.", ex);
            }
        }
    }
}