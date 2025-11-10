using System.Windows.Threading;
using Microsoft.Tools.WindowsInstallerXml.Bootstrapper;

namespace BootstrapperWpf
{
    public class FflowBootstrapperApp : BootstrapperApplication
    {
        protected override void Run()
        {
            var window = new MainWindow(this);
            window.Show();
            Dispatcher.Run();
            Engine.Quit(0);
        }
    }
}