using System;
using System.Diagnostics;
using System.Threading;
using System.Windows;
using Microsoft.Tools.WindowsInstallerXml.Bootstrapper;

namespace FflowBootstrapperApp
{
    public class AppBootstrapper : BootstrapperApplication
    {
        public AppBootstrapper()
        {
            DetectComplete += (s, e) => Engine.Plan(LaunchAction.Install);
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