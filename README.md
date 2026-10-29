# Xoxo Tell Her

Buildthe initialfoundationforanewproduct calledTellHer. PRODUCT THESIS TellHer isawomen-centered trustnetworkforsensitivequestionsandsecondperspectives. Usersbuild asmall circleofwomen theytrust.Whentheywantadvice,theycansendan anonymous "Trust Ripple"totheirdirectcircle,toatwo-hopextendedcircle,or tothe widerTellHer community. ResponsesareorganizedintoaPerspectiveMapratherthana popularityscore.WingwomanisaprivateAI reflectiontoolthatcanlaterturna situation intoaneditableTrustRipple draft. Forthisfirstimplementation,buildONLYthevisualfoundation,publiclandingpage, authenticatedappshell,navigation,andempty states.Donotimplementbackendlogic fortrust,questions,replies,orAIyet. NAVIGATION Desktop:Home,AskHer,MyCircle,Wingwoman,Profile. Mobile: bottomnavigationforHome,AskHer, Circle,Wingwoman;Profileaccessiblefrom avatar/menu. Keep"Start a Ripple"easytoreach. LANDING COPY Headline: "Some thingsyoudon'tasktheinternet. Youaskher." Supportingline: "Trust travels.Identitydoesn'thaveto." Explain the product inthreeshortideas: 1. Startwith yourowninstinct. 2. Choose how faryouranonymousquestiontravels.
3. Seeperspectives, not popularity. Primary CTA:"Enter TellHer"or"Getstarted". VISUALSYSTEM TheUIshould visuallymatchanelegant editorialplanningdocument:-background#F8F2EC (warmcream);-primary #54283E(deep plum);-secondary #B4778B (mutedrose);-accent#C79B58 (softgold);-text#262126(ink);-softsurface#F2E8E5;-success/accent #53735B;-information #567083. Typography:-NotoSerif(or closest availablehigh-quality serif)forheroandmajoreditorial headings;-Interfor navigation, forms,buttons, metadata,anddenseUI. Components:-maturerounded cards, 14-18pxradius;-thinmutedborders and minimalshadow;-generouswhitespace;-clearlabelsabove form fields;-nobright pink stereotype,nogeneric AI illustrations,noexcessivegradients. SIGNATURE VISUAL Usesubtleconcentricripplerings/trust nodesasanabstractvisualmotifinthelanding heroandempty states. Donotoveruseit. Createemptystates/placeholdersfor:-Homedashboard;-MyCircle;-AskHerfeed;-TrustRipplecomposerentry;-Wingwoman;-Profile. Do notcreate fakefunctionalbehavior. Do notaddfeatures outside thisscope. Preserveaclean architectureforlater backend implementation. Verifynavigation,responsivebehavior, focusstates,andreadabilityondesktopandmobile beforefinishing.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://xoxo-tell-her.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/da55a4d6-f91c-4db5-9b63-dded2df35394).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
