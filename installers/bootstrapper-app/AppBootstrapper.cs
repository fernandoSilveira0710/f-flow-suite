using System;
using System.Diagnostics;
using System.Threading;
using System.Windows;
using Microsoft.Tools.WindowsInstallerXml.Bootstrapper;

namespace FflowBootstrapperApp
{
    public class AppBootstrapper : BootstrapperApplication
    {
        private bool _fflowMsiPresent = false;
        private bool _nodePresent = false;
        private string _installedVersion = null;
        private MainWindow _window;

        public AppBootstrapper()
        {
            DetectBegin += (s, e) => UpdateUi("Preparando instalação...", "Verificando pré‑requisitos e instalação existente.");

            // Captura estados dos pacotes durante a detecção
            DetectPackageComplete += (s, e) =>
            {
                try
                {
                    if (string.Equals(e.PackageId, "FflowMsi", StringComparison.OrdinalIgnoreCase))
                    {
                        _fflowMsiPresent = e.State == PackageState.Present;
                    }
                    else if (string.Equals(e.PackageId, "NodeJs", StringComparison.OrdinalIgnoreCase))
                    {
                        _nodePresent = e.State == PackageState.Present;
                    }
                }
                catch { /* ignore */ }
            };

            DetectComplete += (s, e) =>
            {
                // Ler versão instalada do Registro
                try
                {
                    using (var key = Microsoft.Win32.Registry.LocalMachine.OpenSubKey("Software\\F-Flow\\Installer"))
                    {
                        _installedVersion = key?.GetValue("InstalledVersion") as string;
                    }
                }
                catch { /* ignore */ }

                var targetVersion = Engine.StringVariables.Contains("WixBundleVersion") ? Engine.StringVariables["WixBundleVersion"] : null;
                if (_window != null) { _window.Dispatcher.Invoke(() => _window.SetVersionInfo(_installedVersion, targetVersion)); }

                if (_fflowMsiPresent && _nodePresent)
                {
                    UpdateUi("F‑Flow já está instalado.", "Nenhuma ação necessária.");
                    if (_window != null) { _window.Dispatcher.Invoke(() => _window.ShowOpenErp(true)); }
                    QuitSuccess();
                    return;
                }

                UpdateUi("Instalação necessária.", "Planejando instalação dos componentes.");
                Engine.Plan(LaunchAction.Install);
            };

            PlanComplete += (s, e) =>
            {
                UpdateUi("Instalando...", "Aplicando instalação. Aguarde.");
                Engine.Apply(IntPtr.Zero);
            };

            ExecuteProgress += (s, e) =>
            {
                try { if (_window != null) { _window.Dispatcher.Invoke(() => _window.SetProgress(e.OverallPercentage)); } } catch { }
            };

            ApplyComplete += OnApplyComplete;
        }

        protected override void Run()
        {
            // Iniciar UI WPF em STA antes da detecção
            var t = new Thread(() =>
            {
                try
                {
                    var app = new Application();
                    _window = new MainWindow();
                    app.Run(_window);
                }
                catch { /* ignore */ }
            });
            t.SetApartmentState(ApartmentState.STA);
            t.Start();

            Engine.Detect();
        }

        private void OnApplyComplete(object sender, ApplyCompleteEventArgs e)
        {
            UpdateUi("Instalação concluída com sucesso!", "Atalhos criados. Você pode abrir o ERP agora.");
            if (_window != null) { _window.Dispatcher.Invoke(() => _window.ShowOpenErp(true)); }

            try { Process.Start("http://localhost:8080/erp/login"); } catch { }

            QuitSuccess();
        }

        private void UpdateUi(string header, string body)
        {
            try
            {
                if (_window != null)
                {
                    _window.Dispatcher.Invoke(() =>
                    {
                        _window.SetHeader(header);
                        _window.SetBody(body);
                    });
                }
            }
            catch { /* ignore */ }
        }

        private void QuitSuccess()
        {
            try
            {
                if (_window != null) { _window.Dispatcher.Invoke(() => _window.Close()); }
            }
            catch { /* ignore */ }
            Engine.Quit(0);
        }
    }
}