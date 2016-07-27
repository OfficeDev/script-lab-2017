using System.Diagnostics;

namespace OfficeJsSnippetsService.Service
{
    public class Logger
    {
        public void Error(string message)
        {
            Trace.WriteLine("[ERROR] " + message);
        }

        public void Info(string message)
        {
            Trace.WriteLine("[INFO] " + message);
        }
    }
}