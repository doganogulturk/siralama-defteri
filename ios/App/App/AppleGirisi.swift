import AuthenticationServices
import Capacitor

/*
 * Yerel "Apple ile giriş" (App Store 4.8): ekranın altından açılan sistem penceresi, Face ID ile.
 * Web tarafı (`src/lib/auth.ts` → `appleIleYerelGiris`) karıştırılmış bir nonce gönderiyor; eklenti
 * Apple'ın kimlik jetonunu ve yetki kodunu döndürüyor. Jeton Supabase'e (`signInWithIdToken`),
 * kod `apple-iptal` fonksiyonuna gidiyor (hesap silinirken iptal edilebilsin diye yenileme jetonu).
 * Ad ve e-posta Apple'dan yalnızca ilk girişte geliyor.
 */
@objc(AppleGirisiPlugin)
public class AppleGirisiPlugin: CAPPlugin, CAPBridgedPlugin, ASAuthorizationControllerDelegate,
                                ASAuthorizationControllerPresentationContextProviding {
    public let identifier = "AppleGirisiPlugin"
    public let jsName = "AppleGirisi"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "giris", returnType: CAPPluginReturnPromise),
    ]

    private var bekleyen: CAPPluginCall?

    @objc func giris(_ call: CAPPluginCall) {
        let istek = ASAuthorizationAppleIDProvider().createRequest()
        istek.requestedScopes = [.fullName, .email]
        istek.nonce = call.getString("nonce")
        bekleyen = call
        DispatchQueue.main.async {
            let pencere = ASAuthorizationController(authorizationRequests: [istek])
            pencere.delegate = self
            pencere.presentationContextProvider = self
            pencere.performRequests()
        }
    }

    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        return bridge?.webView?.window ?? ASPresentationAnchor()
    }

    public func authorizationController(controller: ASAuthorizationController,
                                        didCompleteWithAuthorization authorization: ASAuthorization) {
        defer { bekleyen = nil }
        guard let kimlik = authorization.credential as? ASAuthorizationAppleIDCredential,
              let veri = kimlik.identityToken,
              let jeton = String(data: veri, encoding: .utf8) else {
            bekleyen?.reject("Apple kimlik jetonu gelmedi.", "JETON_YOK")
            return
        }
        var sonuc: [String: Any] = ["kimlikJetonu": jeton]
        if let kod = kimlik.authorizationCode.flatMap({ String(data: $0, encoding: .utf8) }) { sonuc["kod"] = kod }
        if let ad = kimlik.fullName?.givenName { sonuc["ad"] = ad }
        if let soyad = kimlik.fullName?.familyName { sonuc["soyad"] = soyad }
        bekleyen?.resolve(sonuc)
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        defer { bekleyen = nil }
        // Vazgeçmek ve cihazda Apple hesabı olmaması (.unknown; iOS "Ayarlar'da giriş yapın"
        // uyarısını kendisi gösteriyor) sessiz geçiyor.
        let kod = (error as? ASAuthorizationError)?.code
        if kod == .canceled || kod == .unknown {
            bekleyen?.reject("Vazgeçildi.", "IPTAL")
        } else {
            bekleyen?.reject(error.localizedDescription, "HATA", error)
        }
    }
}
