// SPDX-FileCopyrightText: 2017-2023 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.shared.domain

data class IsoLanguage(
    /** ISO 639-3 identifier */
    val id: String,
    /** ISO 639-2/B alpha-3 code. */
    val alpha3b: String,
    /** ISO 639-2/T alpha-3 code. */
    val alpha3t: String,
    /** ISO 639-1 alpha-2 code */
    val alpha2: String,
    /** Name in Finnish */
    val nameFi: String
)

// A subset of ISO 639-3 languages
// Source for data except nameFi: https://iso639-3.sil.org/code_tables/download_tables
// Source for nameFi:
// https://github.com/unicode-org/cldr-json/blob/main/cldr-json/cldr-localenames-modern/main/fi/languages.json
val ISO_LANGUAGES_SUBSET =
    arrayOf(
        IsoLanguage("aar", "aar", "aar", "aa", "afar"),
        IsoLanguage("abk", "abk", "abk", "ab", "abhaasi"),
        IsoLanguage("afr", "afr", "afr", "af", "afrikaans"),
        IsoLanguage("aka", "aka", "aka", "ak", "akan"),
        IsoLanguage("amh", "amh", "amh", "am", "amhara"),
        IsoLanguage("ara", "ara", "ara", "ar", "arabia"),
        IsoLanguage("arg", "arg", "arg", "an", "aragonia"),
        IsoLanguage("asm", "asm", "asm", "as", "assami"),
        IsoLanguage("ava", "ava", "ava", "av", "avaari"),
        IsoLanguage("ave", "ave", "ave", "ae", "avesta"),
        IsoLanguage("aym", "aym", "aym", "ay", "aimara"),
        IsoLanguage("aze", "aze", "aze", "az", "azeri"),
        IsoLanguage("bak", "bak", "bak", "ba", "baškiiri"),
        IsoLanguage("bam", "bam", "bam", "bm", "bambara"),
        IsoLanguage("bel", "bel", "bel", "be", "valkovenäjä"),
        IsoLanguage("ben", "ben", "ben", "bn", "bengali"),
        IsoLanguage("bis", "bis", "bis", "bi", "bislama"),
        IsoLanguage("bod", "tib", "bod", "bo", "tiibet"),
        IsoLanguage("bos", "bos", "bos", "bs", "bosnia"),
        IsoLanguage("bre", "bre", "bre", "br", "bretoni"),
        IsoLanguage("bul", "bul", "bul", "bg", "bulgaria"),
        IsoLanguage("cat", "cat", "cat", "ca", "katalaani"),
        IsoLanguage("ces", "cze", "ces", "cs", "tšekki"),
        IsoLanguage("cha", "cha", "cha", "ch", "tšamorro"),
        IsoLanguage("che", "che", "che", "ce", "tšetšeeni"),
        IsoLanguage("chu", "chu", "chu", "cu", "kirkkoslaavi"),
        IsoLanguage("chv", "chv", "chv", "cv", "tšuvassi"),
        IsoLanguage("cor", "cor", "cor", "kw", "korni"),
        IsoLanguage("cos", "cos", "cos", "co", "korsika"),
        IsoLanguage("cre", "cre", "cre", "cr", "cree"),
        IsoLanguage("cym", "wel", "cym", "cy", "kymri"),
        IsoLanguage("dan", "dan", "dan", "da", "tanska"),
        IsoLanguage("deu", "ger", "deu", "de", "saksa"),
        IsoLanguage("div", "div", "div", "dv", "divehi"),
        IsoLanguage("dzo", "dzo", "dzo", "dz", "dzongkha"),
        IsoLanguage("ell", "gre", "ell", "el", "kreikka"),
        IsoLanguage("eng", "eng", "eng", "en", "englanti"),
        IsoLanguage("epo", "epo", "epo", "eo", "esperanto"),
        IsoLanguage("est", "est", "est", "et", "viro"),
        IsoLanguage("eus", "baq", "eus", "eu", "baski"),
        IsoLanguage("ewe", "ewe", "ewe", "ee", "ewe"),
        IsoLanguage("fao", "fao", "fao", "fo", "fääri"),
        IsoLanguage("fas", "per", "fas", "fa", "persia"),
        IsoLanguage("fij", "fij", "fij", "fj", "fidži"),
        IsoLanguage("fil", "", "", "", "filipino"),
        IsoLanguage("fin", "fin", "fin", "fi", "suomi"),
        IsoLanguage("fra", "fre", "fra", "fr", "ranska"),
        IsoLanguage("fry", "fry", "fry", "fy", "länsifriisi"),
        IsoLanguage("ful", "ful", "ful", "ff", "fulani"),
        IsoLanguage("gla", "gla", "gla", "gd", "gaeli"),
        IsoLanguage("gle", "gle", "gle", "ga", "iiri"),
        IsoLanguage("glg", "glg", "glg", "gl", "galicia"),
        IsoLanguage("glv", "glv", "glv", "gv", "manksi"),
        IsoLanguage("grn", "grn", "grn", "gn", "guarani"),
        IsoLanguage("guj", "guj", "guj", "gu", "gudžarati"),
        IsoLanguage("hat", "hat", "hat", "ht", "haiti"),
        IsoLanguage("hau", "hau", "hau", "ha", "hausa"),
        IsoLanguage("hbs", "", "", "sh", "serbokroaatti"),
        IsoLanguage("heb", "heb", "heb", "he", "heprea"),
        IsoLanguage("her", "her", "her", "hz", "herero"),
        IsoLanguage("hin", "hin", "hin", "hi", "hindi"),
        IsoLanguage("hmo", "hmo", "hmo", "ho", "hiri-motu"),
        IsoLanguage("hrv", "hrv", "hrv", "hr", "kroatia"),
        IsoLanguage("hun", "hun", "hun", "hu", "unkari"),
        IsoLanguage("hye", "arm", "hye", "hy", "armenia"),
        IsoLanguage("ibo", "ibo", "ibo", "ig", "igbo"),
        IsoLanguage("ido", "ido", "ido", "io", "ido"),
        IsoLanguage("iii", "iii", "iii", "ii", "sichuanin-yi"),
        IsoLanguage("iku", "iku", "iku", "iu", "inuktitut"),
        IsoLanguage("ile", "ile", "ile", "ie", "interlingue"),
        IsoLanguage("ina", "ina", "ina", "ia", "interlingua"),
        IsoLanguage("ind", "ind", "ind", "id", "indonesia"),
        IsoLanguage("ipk", "ipk", "ipk", "ik", "inupiaq"),
        IsoLanguage("isl", "ice", "isl", "is", "islanti"),
        IsoLanguage("ita", "ita", "ita", "it", "italia"),
        IsoLanguage("jav", "jav", "jav", "jv", "jaava"),
        IsoLanguage("jpn", "jpn", "jpn", "ja", "japani"),
        IsoLanguage("kal", "kal", "kal", "kl", "kalaallisut"),
        IsoLanguage("kan", "kan", "kan", "kn", "kannada"),
        IsoLanguage("kas", "kas", "kas", "ks", "kašmiri"),
        IsoLanguage("kat", "geo", "kat", "ka", "georgia"),
        IsoLanguage("kau", "kau", "kau", "kr", "kanuri"),
        IsoLanguage("kaz", "kaz", "kaz", "kk", "kazakki"),
        IsoLanguage("khm", "khm", "khm", "km", "khmer"),
        IsoLanguage("kik", "kik", "kik", "ki", "kikuju"),
        IsoLanguage("kin", "kin", "kin", "rw", "ruanda"),
        IsoLanguage("kir", "kir", "kir", "ky", "kirgiisi"),
        IsoLanguage("kom", "kom", "kom", "kv", "komi"),
        IsoLanguage("kon", "kon", "kon", "kg", "kongo"),
        IsoLanguage("kor", "kor", "kor", "ko", "korea"),
        IsoLanguage("kua", "kua", "kua", "kj", "kuanjama"),
        IsoLanguage("kur", "kur", "kur", "ku", "kurdi"),
        IsoLanguage("lao", "lao", "lao", "lo", "lao"),
        IsoLanguage("lat", "lat", "lat", "la", "latina"),
        IsoLanguage("lav", "lav", "lav", "lv", "latvia"),
        IsoLanguage("lim", "lim", "lim", "li", "limburg"),
        IsoLanguage("lin", "lin", "lin", "ln", "lingala"),
        IsoLanguage("lit", "lit", "lit", "lt", "liettua"),
        IsoLanguage("ltz", "ltz", "ltz", "lb", "luxemburg"),
        IsoLanguage("lub", "lub", "lub", "lu", "katanganluba"),
        IsoLanguage("lug", "lug", "lug", "lg", "ganda"),
        IsoLanguage("mah", "mah", "mah", "mh", "marshall"),
        IsoLanguage("mal", "mal", "mal", "ml", "malajalam"),
        IsoLanguage("mar", "mar", "mar", "mr", "marathi"),
        IsoLanguage("mkd", "mac", "mkd", "mk", "makedonia"),
        IsoLanguage("mlg", "mlg", "mlg", "mg", "malagassi"),
        IsoLanguage("mlt", "mlt", "mlt", "mt", "malta"),
        IsoLanguage("mon", "mon", "mon", "mn", "mongoli"),
        IsoLanguage("mri", "mao", "mri", "mi", "maori"),
        IsoLanguage("msa", "may", "msa", "ms", "malaiji"),
        IsoLanguage("mya", "bur", "mya", "my", "burma"),
        IsoLanguage("nau", "nau", "nau", "na", "nauru"),
        IsoLanguage("nav", "nav", "nav", "nv", "navajo"),
        IsoLanguage("nbl", "nbl", "nbl", "nr", "etelä-ndebele"),
        IsoLanguage("nde", "nde", "nde", "nd", "pohjois-ndebele"),
        IsoLanguage("ndo", "ndo", "ndo", "ng", "ndonga"),
        IsoLanguage("nep", "nep", "nep", "ne", "nepali"),
        IsoLanguage("nld", "dut", "nld", "nl", "hollanti"),
        IsoLanguage("nno", "nno", "nno", "nn", "norjan nynorsk"),
        IsoLanguage("nob", "nob", "nob", "nb", "norjan bokmål"),
        IsoLanguage("nor", "nor", "nor", "no", "norja"),
        IsoLanguage("nya", "nya", "nya", "ny", "njandža"),
        IsoLanguage("oci", "oci", "oci", "oc", "oksitaani"),
        IsoLanguage("oji", "oji", "oji", "oj", "odžibwa"),
        IsoLanguage("ori", "ori", "ori", "or", "orija"),
        IsoLanguage("orm", "orm", "orm", "om", "oromo"),
        IsoLanguage("oss", "oss", "oss", "os", "osseetti"),
        IsoLanguage("pan", "pan", "pan", "pa", "pandžabi"),
        IsoLanguage("pli", "pli", "pli", "pi", "paali"),
        IsoLanguage("pol", "pol", "pol", "pl", "puola"),
        IsoLanguage("por", "por", "por", "pt", "portugali"),
        IsoLanguage("prs", "", "", "", "dari"),
        IsoLanguage("pus", "pus", "pus", "ps", "paštu"),
        IsoLanguage("que", "que", "que", "qu", "ketšua"),
        IsoLanguage("roh", "roh", "roh", "rm", "retoromaani"),
        IsoLanguage("rom", "", "", "", "romani"),
        IsoLanguage("ron", "rum", "ron", "ro", "romania"),
        IsoLanguage("run", "run", "run", "rn", "rundi"),
        IsoLanguage("rus", "rus", "rus", "ru", "venäjä"),
        IsoLanguage("sag", "sag", "sag", "sg", "sango"),
        IsoLanguage("san", "san", "san", "sa", "sanskrit"),
        IsoLanguage("sin", "sin", "sin", "si", "sinhala"),
        IsoLanguage("slk", "slo", "slk", "sk", "slovakki"),
        IsoLanguage("slv", "slv", "slv", "sl", "sloveeni"),
        IsoLanguage("sme", "sme", "sme", "se", "pohjoissaame"),
        IsoLanguage("smn", "smn", "smn", "", "inarinsaame"),
        IsoLanguage("smo", "smo", "smo", "sm", "samoa"),
        IsoLanguage("sms", "sms", "sms", "", "koltansaame"),
        IsoLanguage("sna", "sna", "sna", "sn", "šona"),
        IsoLanguage("snd", "snd", "snd", "sd", "sindhi"),
        IsoLanguage("som", "som", "som", "so", "somali"),
        IsoLanguage("sot", "sot", "sot", "st", "eteläsotho"),
        IsoLanguage("spa", "spa", "spa", "es", "espanja"),
        IsoLanguage("sqi", "alb", "sqi", "sq", "albania"),
        IsoLanguage("srd", "srd", "srd", "sc", "sardi"),
        IsoLanguage("srp", "srp", "srp", "sr", "serbia"),
        IsoLanguage("ssw", "ssw", "ssw", "ss", "swazi"),
        IsoLanguage("sun", "sun", "sun", "su", "sunda"),
        IsoLanguage("swa", "swa", "swa", "sw", "swahili"),
        IsoLanguage("swe", "swe", "swe", "sv", "ruotsi"),
        IsoLanguage("tah", "tah", "tah", "ty", "tahiti"),
        IsoLanguage("tam", "tam", "tam", "ta", "tamili"),
        IsoLanguage("tat", "tat", "tat", "tt", "tataari"),
        IsoLanguage("tel", "tel", "tel", "te", "telugu"),
        IsoLanguage("tgk", "tgk", "tgk", "tg", "tadžikki"),
        IsoLanguage("tgl", "tgl", "tgl", "tl", "tagalog"),
        IsoLanguage("tha", "tha", "tha", "th", "thai"),
        IsoLanguage("tir", "tir", "tir", "ti", "tigrinja"),
        IsoLanguage("ton", "ton", "ton", "to", "tonga"),
        IsoLanguage("tsn", "tsn", "tsn", "tn", "tswana"),
        IsoLanguage("tso", "tso", "tso", "ts", "tsonga"),
        IsoLanguage("tuk", "tuk", "tuk", "tk", "turkmeeni"),
        IsoLanguage("tur", "tur", "tur", "tr", "turkki"),
        IsoLanguage("twi", "twi", "twi", "tw", "twi"),
        IsoLanguage("uig", "uig", "uig", "ug", "uiguuri"),
        IsoLanguage("ukr", "ukr", "ukr", "uk", "ukraina"),
        IsoLanguage("urd", "urd", "urd", "ur", "urdu"),
        IsoLanguage("uzb", "uzb", "uzb", "uz", "uzbekki"),
        IsoLanguage("ven", "ven", "ven", "ve", "venda"),
        IsoLanguage("vie", "vie", "vie", "vi", "vietnam"),
        IsoLanguage("vol", "vol", "vol", "vo", "volapük"),
        IsoLanguage("wln", "wln", "wln", "wa", "valloni"),
        IsoLanguage("wol", "wol", "wol", "wo", "wolof"),
        IsoLanguage("xho", "xho", "xho", "xh", "xhosa"),
        IsoLanguage("yid", "yid", "yid", "yi", "jiddiš"),
        IsoLanguage("yor", "yor", "yor", "yo", "joruba"),
        IsoLanguage("zha", "zha", "zha", "za", "zhuang"),
        IsoLanguage("zho", "chi", "zho", "zh", "kiina"),
        IsoLanguage("zul", "zul", "zul", "zu", "zulu"),
    )
