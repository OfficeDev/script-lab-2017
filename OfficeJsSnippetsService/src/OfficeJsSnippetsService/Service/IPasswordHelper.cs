namespace OfficeJsSnippetsService.Service
{
    public interface IPasswordHelper
    {
        string CreatePassword();
        void CreateSaltAndHash(string password, out string salt, out string hash);
        bool VerifyPassword(string password, string salt, string hash);
    }
}