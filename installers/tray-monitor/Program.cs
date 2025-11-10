using System;
using System.Drawing;
using System.Linq;
using System.ServiceProcess;
using System.Windows.Forms;

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
                Text = "F-Flow Monitor de Serviços"
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

            var allOk = api == ServiceControllerStatus.Running && erp == ServiceControllerStatus.Running;
            var someStopped = api == ServiceControllerStatus.Stopped || erp == ServiceControllerStatus.Stopped;

            // Ícone básico: informação quando OK, aviso quando parcial, erro quando parado
            _tray.Icon = allOk ? SystemIcons.Information : (someStopped ? SystemIcons.Error : SystemIcons.Warning);

            var apiText = $"API: {MapStatus(api)}";
            var erpText = $"ERP: {MapStatus(erp)}";
            _tray.Text = $"F-Flow Monitor\n{apiText}\n{erpText}";

            // Mostra dica esporádica em caso de erro
            if (someStopped)
            {
                _tray.BalloonTipTitle = "Serviços F-Flow";
                _tray.BalloonTipText = $"{apiText}; {erpText}";
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
    }
}