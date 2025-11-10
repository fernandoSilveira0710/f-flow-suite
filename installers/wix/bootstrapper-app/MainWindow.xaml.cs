using System;
using System.Windows;
using Microsoft.Tools.WindowsInstallerXml.Bootstrapper;

namespace BootstrapperWpf
{
    public partial class MainWindow : Window
    {
        private readonly BootstrapperApplication _app;
        private bool _fflowPresent;
        private bool _nodePresent;

        public MainWindow(BootstrapperApplication app)
        {
            InitializeComponent();
            _app = app;

            // Captura estado dos pacotes ao final da detecção de cada item
            _app.DetectPackageComplete += (s, e) =>
            {
                try
                {
                    if (string.Equals(e.PackageId, "FflowMsi", StringComparison.OrdinalIgnoreCase))
                    {
                        _fflowPresent = e.State == PackageState.Present;
                    }
                    else if (string.Equals(e.PackageId, "NodeJs", StringComparison.OrdinalIgnoreCase))
                    {
                        _nodePresent = e.State == PackageState.Present;
                    }
                }
                catch { /* ignore */ }
            };

            // Ao concluir detecção, decidir se instala ou informa que já está atualizado
            _app.DetectComplete += (s, e) =>
            {
                Status("Detecção concluída.");
                if (_fflowPresent && _nodePresent)
                {
                    // Informe claramente na UI e mantenha a janela aberta para o usuário ver
                    MessageBox.Show(
                        "Seu sistema já está com a última versão.",
                        "F-Flow Suite",
                        MessageBoxButton.OK,
                        MessageBoxImage.Information
                    );
                    Status("Seu sistema já está com a última versão. Nenhuma ação necessária.");
                    Dispatcher.Invoke(() => InstallButton.IsEnabled = false);
                    return;
                }

                // Habilita instalação quando há algo a fazer
                Dispatcher.Invoke(() => InstallButton.IsEnabled = true);
            };
            _app.PlanComplete += (s, e) =>
            {
                Status("Plano concluído. Aplicando...");
                _app.Engine.Apply(IntPtr.Zero);
            };
            _app.ApplyComplete += (s, e) =>
            {
                Status("Instalação concluída.");
                Dispatcher.Invoke(() => Close());
            };
            _app.ExecuteProgress += (s, e) => Dispatcher.Invoke(() => Progress.Value = e.OverallPercentage);

            _app.Engine.Detect();
        }

        private void OnInstall(object sender, RoutedEventArgs e)
        {
            InstallButton.IsEnabled = false;
            Status("Planejando instalação...");
            _app.Engine.Plan(LaunchAction.Install);
        }

        private void OnClose(object sender, RoutedEventArgs e)
        {
            Close();
        }

        private void Status(string text)
        {
            Dispatcher.Invoke(() => StatusText.Text = text);
        }
    }
}