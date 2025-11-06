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

        private void OpenErp_Click(object sender, RoutedEventArgs e)
        {
            try { Process.Start("http://localhost:8080/erp/login"); } catch { }
            Close();
        }
    }
}