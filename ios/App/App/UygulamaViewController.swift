import Capacitor

/// Capacitor'ın köprüsü; uygulamanın kendi eklentileri (npm paketi olmayanlar) burada kaydediliyor.
class UygulamaViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(AppleGirisiPlugin())
    }
}
