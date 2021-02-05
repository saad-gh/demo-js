let CODES = [{id:1,code:"AED",currency:"United Arab Emirates Dirham"},{id:2,code:"AFN",currency:"Afghanistan Afghani"},{id:3,code:"ALL",currency:"Albania Lek"},{id:4,code:"AMD",currency:"Armenia Dram"},{id:5,code:"ANG",currency:"Netherlands Antilles Guilder"},{id:6,code:"AOA",currency:"Angola Kwanza"},{id:7,code:"ARS",currency:"Argentina Peso"},{id:8,code:"AUD",currency:"Australia Dollar"},{id:9,code:"AWG",currency:"Aruba Guilder"},{id:10,code:"AZN",currency:"Azerbaijan Manat"},{id:11,code:"BAM",currency:"Bosnia and Herzegovina Convertible Mark"},{id:12,code:"BBD",currency:"Barbados Dollar"},{id:13,code:"BDT",currency:"Bangladesh Taka"},{id:14,code:"BGN",currency:"Bulgaria Lev"},{id:15,code:"BHD",currency:"Bahrain Dinar"},{id:16,code:"BIF",currency:"Burundi Franc"},{id:17,code:"BMD",currency:"Bermuda Dollar"},{id:18,code:"BND",currency:"Brunei Darussalam Dollar"},{id:19,code:"BOB",currency:"Bolivia Bolíviano"},{id:20,code:"BRL",currency:"Brazil Real"},{id:21,code:"BSD",currency:"Bahamas Dollar"},{id:22,code:"BTN",currency:"Bhutan Ngultrum"},{id:23,code:"BWP",currency:"Botswana Pula"},{id:24,code:"BYN",currency:"Belarus Ruble"},{id:25,code:"BZD",currency:"Belize Dollar"},{id:26,code:"CAD",currency:"Canada Dollar"},{id:27,code:"CDF",currency:"Congo/Kinshasa Franc"},{id:28,code:"CHF",currency:"Switzerland Franc"},{id:29,code:"CLP",currency:"Chile Peso"},{id:30,code:"CNY",currency:"China Yuan Renminbi"},{id:31,code:"COP",currency:"Colombia Peso"},{id:32,code:"CRC",currency:"Costa Rica Colon"},{id:33,code:"CUC",currency:"Cuba Convertible Peso"},{id:34,code:"CUP",currency:"Cuba Peso"},{id:35,code:"CVE",currency:"Cape Verde Escudo"},{id:36,code:"CZK",currency:"Czech Republic Koruna"},{id:37,code:"DJF",currency:"Djibouti Franc"},{id:38,code:"DKK",currency:"Denmark Krone"},{id:39,code:"DOP",currency:"Dominican Republic Peso"},{id:40,code:"DZD",currency:"Algeria Dinar"},{id:41,code:"EGP",currency:"Egypt Pound"},{id:42,code:"ERN",currency:"Eritrea Nakfa"},{id:43,code:"ETB",currency:"Ethiopia Birr"},{id:44,code:"EUR",currency:"Euro Member Countries"},{id:45,code:"FJD",currency:"Fiji Dollar"},{id:46,code:"FKP",currency:"Falkland Islands (Malvinas) Pound"},{id:47,code:"GBP",currency:"United Kingdom Pound"},{id:48,code:"GEL",currency:"Georgia Lari"},{id:49,code:"GGP",currency:"Guernsey Pound"},{id:50,code:"GHS",currency:"Ghana Cedi"},{id:51,code:"GIP",currency:"Gibraltar Pound"},{id:52,code:"GMD",currency:"Gambia Dalasi"},{id:53,code:"GNF",currency:"Guinea Franc"},{id:54,code:"GTQ",currency:"Guatemala Quetzal"},{id:55,code:"GYD",currency:"Guyana Dollar"},{id:56,code:"HKD",currency:"Hong Kong Dollar"},{id:57,code:"HNL",currency:"Honduras Lempira"},{id:58,code:"HRK",currency:"Croatia Kuna"},{id:59,code:"HTG",currency:"Haiti Gourde"},{id:60,code:"HUF",currency:"Hungary Forint"},{id:61,code:"IDR",currency:"Indonesia Rupiah"},{id:62,code:"ILS",currency:"Israel Shekel"},{id:63,code:"IMP",currency:"Isle of Man Pound"},{id:64,code:"INR",currency:"India Rupee"},{id:65,code:"IQD",currency:"Iraq Dinar"},{id:66,code:"IRR",currency:"Iran Rial"},{id:67,code:"ISK",currency:"Iceland Krona"},{id:68,code:"JEP",currency:"Jersey Pound"},{id:69,code:"JMD",currency:"Jamaica Dollar"},{id:70,code:"JOD",currency:"Jordan Dinar"},{id:71,code:"JPY",currency:"Japan Yen"},{id:72,code:"KES",currency:"Kenya Shilling"},{id:73,code:"KGS",currency:"Kyrgyzstan Som"},{id:74,code:"KHR",currency:"Cambodia Riel"},{id:75,code:"KMF",currency:"Comorian Franc"},{id:76,code:"KPW",currency:"Korea (North) Won"},{id:77,code:"KRW",currency:"Korea (South) Won"},{id:78,code:"KWD",currency:"Kuwait Dinar"},{id:79,code:"KYD",currency:"Cayman Islands Dollar"},{id:80,code:"KZT",currency:"Kazakhstan Tenge"},{id:81,code:"LAK",currency:"Laos Kip"},{id:82,code:"LBP",currency:"Lebanon Pound"},{id:83,code:"LKR",currency:"Sri Lanka Rupee"},{id:84,code:"LRD",currency:"Liberia Dollar"},{id:85,code:"LSL",currency:"Lesotho Loti"},{id:86,code:"LYD",currency:"Libya Dinar"},{id:87,code:"MAD",currency:"Morocco Dirham"},{id:88,code:"MDL",currency:"Moldova Leu"},{id:89,code:"MGA",currency:"Madagascar Ariary"},{id:90,code:"MKD",currency:"Macedonia Denar"},{id:91,code:"MMK",currency:"Myanmar (Burma) Kyat"},{id:92,code:"MNT",currency:"Mongolia Tughrik"},{id:93,code:"MOP",currency:"Macau Pataca"},{id:94,code:"MRU",currency:"Mauritania Ouguiya"},{id:95,code:"MUR",currency:"Mauritius Rupee"},{id:96,code:"MVR",currency:"Maldives (Maldive Islands) Rufiyaa"},{id:97,code:"MWK",currency:"Malawi Kwacha"},{id:98,code:"MXN",currency:"Mexico Peso"},{id:99,code:"MYR",currency:"Malaysia Ringgit"},{id:100,code:"MZN",currency:"Mozambique Metical"},{id:101,code:"NAD",currency:"Namibia Dollar"},{id:102,code:"NGN",currency:"Nigeria Naira"},{id:103,code:"NIO",currency:"Nicaragua Cordoba"},{id:104,code:"NOK",currency:"Norway Krone"},{id:105,code:"NPR",currency:"Nepal Rupee"},{id:106,code:"NZD",currency:"New Zealand Dollar"},{id:107,code:"OMR",currency:"Oman Rial"},{id:108,code:"PAB",currency:"Panama Balboa"},{id:109,code:"PEN",currency:"Peru Sol"},{id:110,code:"PGK",currency:"Papua New Guinea Kina"},{id:111,code:"PHP",currency:"Philippines Peso"},{id:112,code:"PKR",currency:"Pakistan Rupee"},{id:113,code:"PLN",currency:"Poland Zloty"},{id:114,code:"PYG",currency:"Paraguay Guarani"},{id:115,code:"QAR",currency:"Qatar Riyal"},{id:116,code:"RON",currency:"Romania Leu"},{id:117,code:"RSD",currency:"Serbia Dinar"},{id:118,code:"RUB",currency:"Russia Ruble"},{id:119,code:"RWF",currency:"Rwanda Franc"},{id:120,code:"SAR",currency:"Saudi Arabia Riyal"},{id:121,code:"SBD",currency:"Solomon Islands Dollar"},{id:122,code:"SCR",currency:"Seychelles Rupee"},{id:123,code:"SDG",currency:"Sudan Pound"},{id:124,code:"SEK",currency:"Sweden Krona"},{id:125,code:"SGD",currency:"Singapore Dollar"},{id:126,code:"SHP",currency:"Saint Helena Pound"},{id:127,code:"SLL",currency:"Sierra Leone Leone"},{id:128,code:"SOS",currency:"Somalia Shilling"},{id:129,code:"SPL*",currency:"Seborga Luigino"},{id:130,code:"SRD",currency:"Suriname Dollar"},{id:131,code:"STN",currency:"São Tomé and Príncipe Dobra"},{id:132,code:"SVC",currency:"El Salvador Colon"},{id:133,code:"SYP",currency:"Syria Pound"},{id:134,code:"SZL",currency:"eSwatini Lilangeni"},{id:135,code:"THB",currency:"Thailand Baht"},{id:136,code:"TJS",currency:"Tajikistan Somoni"},{id:137,code:"TMT",currency:"Turkmenistan Manat"},{id:138,code:"TND",currency:"Tunisia Dinar"},{id:139,code:"TOP",currency:"Tonga Pa'anga"},{id:140,code:"TRY",currency:"Turkey Lira"},{id:141,code:"TTD",currency:"Trinidad and Tobago Dollar"},{id:142,code:"TVD",currency:"Tuvalu Dollar"},{id:143,code:"TWD",currency:"Taiwan New Dollar"},{id:144,code:"TZS",currency:"Tanzania Shilling"},{id:145,code:"UAH",currency:"Ukraine Hryvnia"},{id:146,code:"UGX",currency:"Uganda Shilling"},{id:147,code:"USD",currency:"United States Dollar"},{id:148,code:"UYU",currency:"Uruguay Peso"},{id:149,code:"UZS",currency:"Uzbekistan Som"},{id:150,code:"VEF",currency:"Venezuela Bolívar"},{id:151,code:"VND",currency:"Viet Nam Dong"},{id:152,code:"VUV",currency:"Vanuatu Vatu"},{id:153,code:"WST",currency:"Samoa Tala"},{id:154,code:"XAF",currency:"Communauté Financière Africaine (BEAC) CFA Franc BEAC"},{id:155,code:"XCD",currency:"East Caribbean Dollar"},{id:156,code:"XDR",currency:"International Monetary Fund (IMF) Special Drawing Rights"},{id:157,code:"XOF",currency:"Communauté Financière Africaine (BCEAO) Franc"},{id:158,code:"XPF",currency:"Comptoirs Français du Pacifique (CFP) Franc"},{id:159,code:"YER",currency:"Yemen Rial"},{id:160,code:"ZAR",currency:"South Africa Rand"},{id:161,code:"ZMW",currency:"Zambia Kwacha"},{id:162,code:"ZWD",currency:"Zimbabwe Dollar"}];

let UNMAPPEDCODES;
try {
    UNMAPPEDCODES = Array.from(document.getElementById('unmappedcodes').getElementsByTagName('li'));
} catch(err) {
    UNMAPPEDCODES = undefined;
}
const e = React.createElement

class UnmappedCode extends React.Component{
    constructor(props){
        super(props);
    }
    render() {
        return e(
            'option',
            {value:this.props.code},
            this.props.code
        )
    }    
}

class MappedInputs extends React.Component{
    constructor(props){
        super(props);
        this.a = [];
        Object.entries(this.props.pairs).forEach(entry => {
            if(this.props.hetro_pairs[entry[0]])
                entry.push(1)
            else
                entry.push(0)

            this.a.push(entry)
        }); 
    }

    render() {
        return this.a.map((mi,i) => {
            return e(
                'input',
                { 
                    value : `${mi[0]},${mi[1]},${mi[2]}`,
                    name : `mappedinput_${i}`,
                    type : 'hidden'
                }
            )
        })
    }    
}

// class Unpaired extends React.Component{
//     constructor(props){
//         super(props);
//     }
//     render() {
//         return e(
//             'option',
//             {value:this.props.code},
//             this.props.code
//         )
//     }    
// }

class MapCodes extends React.Component{
    constructor(){
        super();
        this.codes = CODES.map((c) => { return c.code });
        this.state = {
            code_xero : "",
            code_sage : "",
            pairs : {},
            pair_error : undefined,
            dd_pairs : {},
            hetro_pairs : {},
            mappedinputsready : false
        }
    }

    render() {
        return e(
            'div',
            {},
            e(
                'select',
                { 
                    onChange: (event) => {                        
                        let _ = CODES.filter((c) => {
                            return c.code == event.target.value;
                        }),                        
                        _c_x = this.state.pairs[event.target.value] || (_.length == 0 ? "" : _[0].code),
                        _c_s = event.target.value,
                        new_state = {
                            code_xero : _c_x,
                            code_sage : _c_s
                        }

                        if(_c_x !== ""){
                            let _dd_p = Object.assign({},this.state.dd_pairs),
                            _p = Object.assign({},this.state.pairs);

                            _dd_p[_c_s] = _c_x;
                            _p[_c_s] = _c_x;
                            new_state = Object.assign( new_state, { dd_pairs : _dd_p, pairs :  _p, pair_error : false } )
                        } else {
                            new_state = Object.assign( new_state, { pair_error :  true } )
                        }

                        this.setState(new_state);
                    },
                    disabled: this.state.pair_error !== undefined && this.state.pair_error
                },
                e(
                    'option',
                    {
                        value:"",
                        disabled:true,
                        selected:true,
                        display:'none'
                    },
                    'Please confirm mapping ...'
                ),
                UNMAPPEDCODES.map((c) => {                        
                        return e(
                            UnmappedCode,
                            {code:c.textContent || c.innerText}
                        )
                    }
                )
            ),
            e(
                'input',
                {
                    type:'text',
                    value:this.state.code_xero,
                    onChange:(event) => {
                        let _c_x = event.target.value,
                        _c_s = this.state.code_sage,
                        new_state = {};
                        if(_c_s !== "" && _c_x !== "" && this.codes.indexOf(_c_x) !== -1){
                            let _p = Object.assign({},this.state.pairs),
                            _h_p = Object.assign({},this.state.hetro_pairs);
                            if(_c_s != _c_x){
                                _h_p[_c_s] = _c_x;
                                new_state.hetro_pairs = _h_p
                            }
                            _p[_c_s] = _c_x;
                            new_state.pairs = _p;
                            new_state.pair_error = false;
                        } else if(_c_s !== "") {
                            new_state.pair_error = true;
                        }
                        new_state.code_xero = event.target.value;
                        this.setState(new_state);
                    },
                    list:'xerocodelist'
                }
            ),
            e(
                'datalist',
                { id:"xerocodelist" },
                CODES.map((c) => {
                    return e(
                        'option',
                        { value : c.code },
                        c.currency
                    )
                })
            ),
            this.state.mappedinputsready ? e(
                MappedInputs,
                {
                    pairs : this.state.pairs,
                    hetro_pairs : this.state.hetro_pairs
                },
                ""
             ) : "",
            e(
                'button',
                {
                    type:'submit',
                    disabled: Object.keys(this.state.pairs).length < UNMAPPEDCODES.length,
                    onClick: (e) => {
                        this.setState(
                            { mappedinputsready : true }
                        );
                    }
                },
                'Sage to Xero'
            )
        ) 
    }     
}

if(UNMAPPEDCODES)
    ReactDOM.render(
        e(MapCodes),
        document.getElementById('mapcodes')
    )

// Binding search handler
// https://stackoverflow.com/questions/32317154/react-uncaught-typeerror-cannot-read-property-setstate-of-undefined