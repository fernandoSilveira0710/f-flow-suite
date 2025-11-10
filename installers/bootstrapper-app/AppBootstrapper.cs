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

        public AppBootstrapper()
        {
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

            // Se tudo já está presente, apenas informa e sai; caso contrário planeja instalação
            DetectComplete += (s, e) =>
            {
                if (_fflowMsiPresent && _nodePresent)
                {
                    try
                    {
                        MessageBox.Show(
                            "Seu sistema já está com a última versão.",
                            "F-Flow Suite",
                            MessageBoxButton.OK,
                            MessageBoxImage.Information
                        );
                    }
                    catch { /* ignore */ }

                    Engine.Quit(0);
                    return;
                }

                Engine.Plan(LaunchAction.Install);
            };
            PlanComplete += (s, e) => Engine.Apply(IntPtr.Zero);
            ApplyComplete += OnApplyComplete;
        }

        protected override void Run()
        {
            Engine.Detect();
        }

        private void OnApplyComplete(object sender, ApplyCompleteEventArgs e)
        {
            // Abre a janela de sucesso em thread STA (WPF)
            var t = new Thread(() =>
            {
                try
                {
                    var app = new Application();
                    var win = new MainWindow();
                    app.Run(win);
                }
                catch { /* ignore */ }
            });
            t.SetApartmentState(ApartmentState.STA);
            t.Start();
            t.Join();

            // Opcional: abrir ERP diretamente também
            try { Process.Start("http://localhost:8080/erp/login"); } catch { }

            Engine.Quit(0);
        }
    }
}