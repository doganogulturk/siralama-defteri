import Capacitor
import UIKit

/// Capacitor'ın köprüsü; uygulamanın kendi eklentileri (npm paketi olmayanlar) burada kaydediliyor.
class UygulamaViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(AppleGirisiPlugin())

        // Sayfa çizilene kadar görünen WebView zemini açılış ekranınınkiyle aynı ve temaya göre:
        // capacitor.config.ts'teki `backgroundColor` tek renk, koyu temada açılıştan sonra bir an açık kâğıt görünürdü.
        if let zemin = UIColor(named: "AcilisZemin") {
            webView?.isOpaque = false
            webView?.backgroundColor = zemin
            webView?.scrollView.backgroundColor = zemin
        }
    }
}
