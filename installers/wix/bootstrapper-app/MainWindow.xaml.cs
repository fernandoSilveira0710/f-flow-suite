using System;
using System.Windows;
using Microsoft.Tools.WindowsInstallerXml.Bootstrapper;

namespace BootstrapperWpf
{
    public partial class MainWindow : Window
    {
        private readonly BootstrapperApplication _app;

        public MainWindow(BootstrapperApplication app)
        {
            InitializeComponent();
            _app = app;

            _app.DetectComplete += (s, e) => { Status("Detecção concluída."); };
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