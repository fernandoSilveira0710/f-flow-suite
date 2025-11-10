using System;
using System.Drawing;
using System.Linq;
using System.ServiceProcess;
using System.Windows.Forms;
using System.Net;
using System.IO;

namespace ServiceTrayMonitor
{
    internal static class Program
    {
        private static NotifyIcon _tray;
        private static Timer _timer;
        private static ContextMenuStrip _menu;

        // Nomes dos serviços instalados (scripts em installers/windows/service-install.ps1)
        private const string ServiceApi = "F-Flow-Client-Local";
        private const string ServiceErp = "F-Flow-ERP-Static";

        [STAThread]
        private static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            _tray = new NotifyIcon
            {
                Visible = true,
                Text = "F-Flow Monitor de Serviços",
                Icon = LoadBrandIcon()
            };

            _menu = new ContextMenuStrip();
            _menu.Items.Add(new ToolStripMenuItem("Abrir Serviços", null, (s, e) =>
            {
                try { System.Diagnostics.Process.Start("services.msc"); } catch { }
            }));
            _menu.Items.Add(new ToolStripSeparator());
            _menu.Items.Add(new ToolStripMenuItem("Sair", null, (s, e) =>
            {
                _tray.Visible = false;
                _timer?.Stop();
                _timer?.Dispose();
                _tray.Dispose();
                Application.Exit();
            }));
            _tray.ContextMenuStrip = _menu;

            // Atualiza inicialmente e depois em intervalo
            UpdateStatus();
            _timer = new Timer { Interval = 10000 };
            _timer.Tick += (s, e) => UpdateStatus();
            _timer.Start();

            Application.Run();
        }

        private static void UpdateStatus()
        {
            var api = GetServiceStatus(ServiceApi);
            var erp = GetServiceStatus(ServiceErp);
            var hub = GetHubHealthStatus();

            var allOk = api == ServiceControllerStatus.Running && erp == ServiceControllerStatus.Running && hub == "OK";
            var someStopped = api == ServiceControllerStatus.Stopped || erp == ServiceControllerStatus.Stopped || hub != "OK";

            // Ícone fixo de marca (não alterar dinamicamente)

            var apiText = $"API: {MapStatus(api)}";
            var erpText = $"ERP: {MapStatus(erp)}";
            var hubText = $"Hub: {hub}";
            _tray.Text = $"F-Flow Monitor\n{apiText}\n{erpText}\n{hubText}";

            // Mostra dica esporádica em caso de erro
            if (someStopped)
            {
                _tray.BalloonTipTitle = "Serviços F-Flow";
                _tray.BalloonTipText = $"{apiText}; {erpText}; {hubText}";
                _tray.BalloonTipIcon = ToolTipIcon.Error;
                _tray.ShowBalloonTip(1000);
            }
        }

        private static ServiceControllerStatus GetServiceStatus(string serviceName)
        {
            try
            {
                var svc = ServiceController.GetServices().FirstOrDefault(s => string.Equals(s.ServiceName, serviceName, StringComparison.OrdinalIgnoreCase));
                return svc?.Status ?? ServiceControllerStatus.Stopped;
            }
            catch
            {
                return ServiceControllerStatus.Stopped;
            }
        }

        private static string MapStatus(ServiceControllerStatus status)
        {
            switch (status)
            {
                case ServiceControllerStatus.Running: return "Rodando";
                case ServiceControllerStatus.Stopped: return "Parado";
                case ServiceControllerStatus.Paused: return "Pausado";
                default: return status.ToString();
            }
        }

        private static Icon LoadBrandIcon()
        {
            try
            {
                var path = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "installers", "2F.ico");
                var full = Path.GetFullPath(path);
                if (File.Exists(full))
                {
                    return new Icon(full);
                }
            }
            catch { }
            return SystemIcons.Application;
        }

        private static string GetHubHealthStatus()
        {
            try
            {
                var req = (HttpWebRequest)WebRequest.Create("http://localhost:3001/health");
                req.Method = "GET";
                req.Timeout = 1500; // 1.5s timeout para não travar a UI
                using (var resp = (HttpWebResponse)req.GetResponse())
                {
                    if (resp.StatusCode == HttpStatusCode.OK)
                    {
                        // Opcionalmente poderíamos ler o corpo, mas OK já é suficiente
                        return "OK";
                    }
                    return $"Erro ({(int)resp.StatusCode})";
                }
            }
            catch
            {
                return "Indisponível";
            }
        }
    }
}