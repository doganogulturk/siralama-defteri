import Capacitor
import UIKit
import WebKit

/// Capacitor'ın köprüsü; uygulamanın kendi eklentileri (npm paketi olmayanlar) burada kaydediliyor.
class UygulamaViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(AppleGirisiPlugin())
        bridge?.registerPluginInstance(TemaPlugin())

        // Profil'de elle seçilen tema (bir önceki açılıştan): durum çubuğu ve aşağıdaki zemin onu izlesin.
        overrideUserInterfaceStyle = TemaPlugin.kayitliStil()
        // Sayfa da ilk boyamadan önce o temada açılsın: statik pakette sunucu çerezi göremiyor. Betik
        // `src/lib/tema.ts` → `TEMA_BETIGI`'nin aynısı; biri değişirse öbürü de.
        webView?.configuration.userContentController.addUserScript(WKUserScript(
            source: TemaPlugin.betik, injectionTime: .atDocumentStart, forMainFrameOnly: true))

        // Sayfa çizilene kadar görünen WebView zemini açılış ekranınınkiyle aynı ve temaya göre:
        // capacitor.config.ts'teki `backgroundColor` tek renk, koyu temada açılıştan sonra bir an açık kâğıt görünürdü.
        if let zemin = UIColor(named: "AcilisZemin") {
            webView?.isOpaque = false
            webView?.backgroundColor = zemin
            webView?.scrollView.backgroundColor = zemin
        }
    }
}

/*
 * Profil → Tema (web: `src/lib/tema.ts`). Seçim "acik" / "koyu" ise ekran o görünümde kalıyor, "sistem"de
 * cihazı izliyor. Böylece durum çubuğunun yazısı (elle "Açık" seçilip cihaz koyuyken beyaz kalırdı) ve sayfa
 * yüklenene kadarki zemin (`AcilisZemin`) sayfayla uyumlu. Seçim sonraki açılış için saklanıyor; açılış ekranı
 * (LaunchScreen) uygulama kodundan önce çizildiği için her zaman cihazın temasında.
 */
@objc(TemaPlugin)
public class TemaPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "TemaPlugin"
    public let jsName = "Tema"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "ayarla", returnType: CAPPluginReturnPromise),
    ]

    private static let anahtar = "tema"

    /// `src/lib/tema.ts` → `TEMA_BETIGI` (lib/tema.test.ts ikisinin aynı olduğunu denetliyor).
    static let betik = """
    (function(){try{var d=localStorage.getItem("siralama-defteri:tema");if(d==='acik'||d==='koyu'){document.documentElement.setAttribute('data-tema',d)}else if(d==='sistem'){document.documentElement.removeAttribute('data-tema')}}catch(e){}})()
    """

    static func stil(_ tema: String?) -> UIUserInterfaceStyle {
        switch tema {
        case "acik": return .light
        case "koyu": return .dark
        default: return .unspecified
        }
    }

    static func kayitliStil() -> UIUserInterfaceStyle {
        return stil(UserDefaults.standard.string(forKey: anahtar))
    }

    @objc func ayarla(_ call: CAPPluginCall) {
        let tema = call.getString("tema") ?? "sistem"
        UserDefaults.standard.set(tema, forKey: TemaPlugin.anahtar)
        DispatchQueue.main.async {
            if let ekran = self.bridge?.viewController {
                ekran.overrideUserInterfaceStyle = TemaPlugin.stil(tema)
                ekran.setNeedsStatusBarAppearanceUpdate()
            }
            call.resolve()
        }
    }
}
