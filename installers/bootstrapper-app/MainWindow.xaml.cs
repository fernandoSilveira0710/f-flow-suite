using System;
using System.Diagnostics;
using System.Windows;

namespace FflowBootstrapperApp
{
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
        }

        public void SetHeader(string text)
        {
            HeaderText.Text = text;
        }

        public void SetBody(string text)
        {
            BodyText.Text = text;
        }

        public void SetVersionInfo(string installedVersion, string targetVersion)
        {
            VersionText.Text = $"Instalado: {installedVersion ?? "(não encontrado)"} | Disponível: {targetVersion ?? "(desconhecido)"}";
        }

        public void SetProgress(int percent)
        {
            try
            {
                ProgressBar.Width = Math.Max(0, Math.Min(1, percent / 100.0)) * 480;
            }
            catch { /* ignore */ }
        }

        public void ShowOpenErp(bool show)
        {
            OpenErpButton.Visibility = show ? Visibility.Visible : Visibility.Collapsed;
        }

        private void OpenErp_Click(object sender, RoutedEventArgs e)
        {
            try { Process.Start("http://localhost:8080/erp/login"); } catch { }
            Close();
        }

        private void Close_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }
    }
}