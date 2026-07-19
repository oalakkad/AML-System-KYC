// Real, publicly-published sanctions data — a curated snapshot from the
// OFAC SDN and UN Consolidated List public feeds (fetched 2026-07-14/15), not
// a live daily sync. See src/lib/screening/lists.ts for why only these two
// list sources are populated. Regenerate by re-running the extraction if a
// fresher snapshot is ever needed.

export interface SanctionsSeedRecord {
  fullName: string;
  aliases: string[];
  listSource: 'OFAC_SDN' | 'UN_CONSOLIDATED';
  entityType: 'INDIVIDUAL' | 'ENTITY' | 'VESSEL';
  programs: string;
  nationality: string | null;
  dob: string | null;
}

export const SANCTIONS_SEED_DATA: SanctionsSeedRecord[] = [
  {
    "fullName": "Abu ABBAS",
    "aliases": [
      "Muhammad ZAYDAN"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": null,
    "dob": "10 Dec 1948"
  },
  {
    "fullName": "Shaykh Umar Abd AL RAHMAN",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": null,
    "dob": "03 May 1938"
  },
  {
    "fullName": "Dr. Ayman AL ZAWAHIRI",
    "aliases": [
      "Ayman AL-ZAWAHIRI",
      "Ahmad Fuad SALIM",
      "Aiman Muhammad Rabi AL-ZAWAHIRI"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": null,
    "dob": "19 Jun 1951"
  },
  {
    "fullName": "Abboud Abdul Latif Hassan AL-ZOMOR",
    "aliases": [
      "Abbud ZUMAR",
      "Abbud AL-ZUMAR",
      "Aboud Abdul Latif Hasan EL-ZOMOR",
      "Abood Abdul Latif Hassan AL-ZUMUR",
      "Abboud Abdul Latif Hassan AL-ZAMUR"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": "Egypt",
    "dob": "19 Apr 1947"
  },
  {
    "fullName": "Abd Al Aziz AWDA",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": null,
    "dob": "1946"
  },
  {
    "fullName": "Shaykh Muhammad Husayn FADLALLAH",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": null,
    "dob": "1938"
  },
  {
    "fullName": "Nayif HAWATMA",
    "aliases": [
      "Nayif HAWATMEH",
      "Nayif HAWATMAH",
      "Abu KHALID"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": null,
    "dob": "1933"
  },
  {
    "fullName": "Mohammad Shawqi ISLAMBOULI",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": null,
    "dob": "15 Jan 1955"
  },
  {
    "fullName": "Ahmad JABRIL",
    "aliases": [
      "Ahmad JIBRIL"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": null,
    "dob": "1938"
  },
  {
    "fullName": "Talal Muhammad Rashid NAJI",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": null,
    "dob": "1930"
  },
  {
    "fullName": "Hasan NASRALLAH",
    "aliases": [
      "Hasan Abd-al-Karim NASRALLAH"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": "Lebanon",
    "dob": "31 Aug 1960"
  },
  {
    "fullName": "Subhi TUFAYLI",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": null,
    "dob": "1947"
  },
  {
    "fullName": "Sheik Ahmed Ismail YASSIN",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": "Region: Gaza",
    "dob": "1938"
  },
  {
    "fullName": "Mousa Mohammed ABU MARZOOK",
    "aliases": [
      "Musa Abu MARZUK",
      "Dr. Musa ABU-MARZUQ",
      "Mousa Mohamed Abou MARZOOK",
      "Sa'id ABU-MARZUQ",
      "ABU-'UMAR",
      "Musa Abu MARZOUK"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": null,
    "dob": "09 Feb 1951"
  },
  {
    "fullName": "Gilberto Jose RODRIGUEZ OREJUELA",
    "aliases": [
      "THE CHESS PLAYER",
      "LUCAS"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDNT",
    "nationality": "Colombia",
    "dob": "31 Jan 1939"
  },
  {
    "fullName": "Miguel Angel RODRIGUEZ OREJUELA",
    "aliases": [
      "EL SENOR",
      "PATRICIA",
      "PATRICIO",
      "PATTY",
      "PAT",
      "MANUEL",
      "MANOLO",
      "MIKE",
      "MAURO",
      "DOCTOR M.R.O."
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDNT",
    "nationality": "Colombia",
    "dob": "23 Nov 1943"
  },
  {
    "fullName": "Ramadan ABDALLAH",
    "aliases": [
      "Dr. Ramadan ABDULLAH",
      "Dr. Ramadan Abdullah SHALLAH",
      "Ramadan Abdalla Mohamed SHALLAH"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": "Syria",
    "dob": "01 Jan 1958"
  },
  {
    "fullName": "Usama bin Muhammad bin Awad BIN LADIN",
    "aliases": [
      "Usama BIN LADIN",
      "Usama BIN LADEN",
      "Osama BIN LADEN",
      "Osama BIN LADIN",
      "Osama bin Muhammad bin Awad BIN LADIN"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": null,
    "dob": "30 Jul 1957"
  },
  {
    "fullName": "Abu Hafs AL-MASRI",
    "aliases": [
      "Sheikh Taysir ABDULLAH",
      "Muhammad ATEF",
      "Abu Hafs el Masry EL KHABIR",
      "TAYSIR",
      "ABU HAFS",
      "Muhammad ATIF",
      "Subhi ABU SITTA",
      "Mohamed ATIF"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": null,
    "dob": "1951"
  },
  {
    "fullName": "Rifa'i Ahmad Taha MUSA",
    "aliases": [
      "'ABD-AL-'IZ",
      "Abd-al-Hai Ahmad ABD-AL-WAHAB",
      "ABU YASIR",
      "'Issam 'Ali Muhammad 'ABD ALLAH",
      "Salah 'Ali AL-KAMEL",
      "Rifa'i Ahmad TAHA MUSA",
      "THABIT 'IZ"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": null,
    "dob": "24 Jun 1954"
  },
  {
    "fullName": "Mohammed OMAR",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": "Afghanistan",
    "dob": "1950"
  },
  {
    "fullName": "Jose de Jesus AMEZCUA CONTRERAS",
    "aliases": [
      "Chuey AMESCUA",
      "Chuy AMEZCUA",
      "Jesus AMEZCUA CONTRERAS",
      "Jose de Jesus AMEZCUA",
      "Adan HERNANDEZ"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDNTK",
    "nationality": null,
    "dob": "31 Jul 1964"
  },
  {
    "fullName": "Luis Ignacio AMEZCUA CONTRERAS",
    "aliases": [
      "Luis AMEZCUA",
      "Luis C. CONTRERAS",
      "Luis LOPEZ",
      "Eduardo LOZANO",
      "Salvador OCHOA",
      "Sergio RODRIGUEZ LOPEZ"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDNTK",
    "nationality": null,
    "dob": "22 Feb 1964"
  },
  {
    "fullName": "Ramon Eduardo ARELLANO FELIX",
    "aliases": [
      "Gilberto COMACHO RODRIGUES",
      "Ramon TORRES MENDEZ"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDNTK",
    "nationality": null,
    "dob": "31 Aug 1964"
  },
  {
    "fullName": "Rafael CARO QUINTERO",
    "aliases": [
      "Raphael CARO QUINTERO"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDNTK",
    "nationality": null,
    "dob": "12 Dec 1952"
  },
  {
    "fullName": "Vicente CARRILLO FUENTES",
    "aliases": [
      "Andres CARRILLO FUENTES"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDNTK",
    "nationality": null,
    "dob": "16 Oct 1962"
  },
  {
    "fullName": "Chi Fu CHANG",
    "aliases": [
      "KHUN SA",
      "Changtrakul CHAN",
      "Shi-Fu CHANG",
      "Xifu CHANG",
      "Chan CHANGTRAKUL"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDNTK",
    "nationality": null,
    "dob": "17 Feb 1933"
  },
  {
    "fullName": "Noel Timothy HEATH",
    "aliases": [
      "Noel Heath ZAMBA",
      "Noel Heath ZAMBO"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDNTK",
    "nationality": "Saint Kitts and Nevis",
    "dob": "16 Dec 1949"
  },
  {
    "fullName": "Oluwole A. OGUNGBUYI",
    "aliases": [
      "Babestan Oluwole ADEMULERO",
      "Wole A. BABESTAN",
      "Wally OGUNGBUYI",
      "Wole A. OGUNGBUYI",
      "Olatude I. SHOFESO",
      "Olatunde Irewole SHOFESO"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDNTK",
    "nationality": null,
    "dob": "04 Mar 1953"
  },
  {
    "fullName": "Abeni O. OGUNGBUYI",
    "aliases": [
      "Abeni O. BABESTAN",
      "Olatutu Temitope SHOFESO"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDNTK",
    "nationality": null,
    "dob": "30 Jun 1952"
  },
  {
    "fullName": "Hsueh Kang WEI",
    "aliases": [
      "Chiwinnitipanya CHARNCHAI",
      "Prasit CHIVINNITIPANYA",
      "Charnchai CHIWINNITIPANYA",
      "Chivinnitipanya PRASIT",
      "Cheewinnittipanya PRASIT",
      "Shao-Kang WEI",
      "Sia-Kang WEI",
      "Xuekang WEI",
      "Prasit CHEEWINNITTIPANYA"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDNTK",
    "nationality": null,
    "dob": "29 Jun 1952"
  },
  {
    "fullName": "Benjamin Alberto ARELLANO FELIX",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDNTK",
    "nationality": null,
    "dob": "12 Mar 1952"
  },
  {
    "fullName": "Arcangel de Jesus HENAO MONTOYA",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDNT",
    "nationality": "Colombia",
    "dob": "07 Oct 1954"
  },
  {
    "fullName": "Olga Patricia GONZALEZ BENITEZ",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDNT",
    "nationality": "Colombia",
    "dob": "04 Aug 1965"
  },
  {
    "fullName": "Victor Julio PATINO FOMEQUE",
    "aliases": [
      "Victor Hugo PATINO FOMEQUE"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDNT",
    "nationality": "Colombia",
    "dob": "31 Jan 1959"
  },
  {
    "fullName": "Jorge Alirio DUQUE BOTERO",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDNT",
    "nationality": "Colombia",
    "dob": "04 Jun 1949"
  },
  {
    "fullName": "Sher AFGHAN",
    "aliases": [
      "Shir AFGHAN",
      "Abdullah KHAN",
      "Mohammad AZIZ",
      "Shear AFGHAN"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDNTK",
    "nationality": null,
    "dob": "1962"
  },
  {
    "fullName": "Osiel CARDENAS GUILLEN",
    "aliases": [
      "Osiel CARDENAS GULLEN",
      "Osiel CARDENAS CASTILLO",
      "Osiel CARDENAS GILLEN",
      "Ociel CARDENAS GUILLEN",
      "Oscar CARDENAS GUILLEN",
      "Oziel CARDENAS GUILLEN",
      "Osiel CARDENAS TUILLEN",
      "Jorge SALINA AGUILAR",
      "Jorge SALINAS AGUILAR"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDNTK",
    "nationality": null,
    "dob": "18 May 1967"
  },
  {
    "fullName": "Miguel Angel CARO QUINTERO",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDNTK",
    "nationality": null,
    "dob": "09 Mar 1963"
  },
  {
    "fullName": "Ping Yun CHANG",
    "aliases": [
      "Saeng KHUN"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDNTK",
    "nationality": null,
    "dob": "07 Jan 1940"
  },
  {
    "fullName": "Joseph GILBOA",
    "aliases": [
      "Yosef GILBOA",
      "Joseph Papzian GILBOA",
      "Joseph GILBERT",
      "Josef GIL"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDNTK",
    "nationality": null,
    "dob": "08 Apr 1943"
  },
  {
    "fullName": "Joaquin GUZMAN LOERA",
    "aliases": [
      "Max AREGON",
      "Chapo GUZMAN",
      "Jose Luis GUIERREZ LOERA",
      "Joaquin GUZMAN FERNANDEZ",
      "Joaquin GUZMAN LOESA",
      "Joaquin GUZMAN PADILLA",
      "Joaquin GUMAN LOERAL",
      "Archibaldo GUZMAN",
      "Aureliano GUZMAN",
      "Miguel ORTEGA",
      "Joise Luis RAMIREZ",
      "Gilberto CARO RODRIGUEZ",
      "Joaquin Chapo GUZMAN",
      "Chapo GUZMAN LOREA",
      "Joaguin GUZMAN LOEIA",
      "Achivaldo GUZMAN",
      "Gilberto OSUNA",
      "Jorge RAMOX PEREZ"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDNTK",
    "nationality": null,
    "dob": "25 Dec 1954"
  },
  {
    "fullName": "Jamiel HAMIEH",
    "aliases": [
      "Jamiel HAMIAH",
      "Jamel HAMEIAH",
      "Mamil HAMEIAH",
      "Jamill HAMEIH",
      "Jamil HAMIAEH",
      "Jamil Abdulkarim HAMIE",
      "Jamiel HAMIEAH",
      "Jamil HAMEIAH",
      "Jamil HAMEIEH",
      "Jamil HAMER",
      "Jamil HAMIE",
      "Jamile HAMIE",
      "Jamil HAMIEAH",
      "Jamal HAMIEH",
      "Jamil HAMIEH",
      "Jamil HAMIEL",
      "Jamil HAMIEYYEH",
      "Abdul Jamil HAMIYA",
      "Jamil HAMIYYAH",
      "Jamil HAMYH",
      "Jamil Abdul KARIM",
      "Abu NEZAM",
      "Mamil HAMIEH",
      "Jamil HAMIEYE",
      "Jamil HAMIL",
      "Jamil HAMIYE",
      "Jamil HAMIYYEH",
      "Abou NAZIM",
      "Abou NIZAM"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDNTK",
    "nationality": null,
    "dob": "Sep 1938"
  },
  {
    "fullName": "Ismael HIGUERA GUERRERO",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDNTK",
    "nationality": null,
    "dob": "17 Mar 1961"
  },
  {
    "fullName": "Nasir Ali KHAN",
    "aliases": [
      "Ali KHAN",
      "Nafir Ali KHAN",
      "Nazir Ali KHAN",
      "Nisan Ali KHAN",
      "Nisar Ali KHAN",
      "Ali Khan NASIR",
      "Khan Ali NASIR"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDNTK",
    "nationality": null,
    "dob": "01 Oct 1955"
  },
  {
    "fullName": "Oscar MALHERBE DE LEON",
    "aliases": [
      "Martin BECERRA",
      "Martin BECERRA MIRELES",
      "Oscar MACHERBE",
      "Oscar MAHLERBE",
      "Oscar MALARBE",
      "Oscar MALERHBE DE LEON",
      "Oscar MALHARBE DE LEON",
      "Oscar MALHERBE DELEON",
      "Oscar MALMERBE",
      "Oscar MELARBE",
      "Oscar QALHARBE DE LEON",
      "Oscar MAHERBE",
      "Polo MAHLERBE",
      "Oscar MALERBE",
      "Oscar MALERVA",
      "Oscar NALHERBE",
      "Jorge VARGAS"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDNTK",
    "nationality": null,
    "dob": "10 Jan 1964"
  },
  {
    "fullName": "Alcides RAMON MAGANA",
    "aliases": [
      "Ramon ALCIDES MAGANA",
      "Ramon ALCIDEZ MAGANA",
      "Ramon ALCIDES MAYENA",
      "Ramon MAGNA ALCIDEDES",
      "Ramon ALCIDES MAGANE",
      "Antonio ROMERO",
      "Jorge GONZALEZ QUIONES",
      "Jorge MAGANA",
      "Ramon MAGANA ALCIDES",
      "Alcides MATA",
      "Alcedis RAMON MAGANA"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDNTK",
    "nationality": null,
    "dob": "04 Sep 1957"
  },
  {
    "fullName": "Sayf AL-ADL",
    "aliases": [
      "Saif AL-'ADIL"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": null,
    "dob": "1963"
  },
  {
    "fullName": "Mahfouz Ould AL-WALID",
    "aliases": [
      "Khalid AL-SHANQITI",
      "Mafouz Walad AL-WALID",
      "ABU HAFS THE MAURITANIAN"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": "Mauritania",
    "dob": "01 Jan 1975"
  },
  {
    "fullName": "Zayn al-Abidin Muhammad HUSAYN",
    "aliases": [
      "Zain Al-Abidin Muhammad HUSAIN",
      "ABU ZUBAIDA",
      "Zayn al-Abidin Muhammad HUSSEIN",
      "Zeinulabideen Muhammed Husein ABU ZUBEIDAH",
      "ABU ZUBAYDAH"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": "Cuba",
    "dob": "12 Mar 1971"
  },
  {
    "fullName": "Abd al-Hadi AL-IRAQI",
    "aliases": [
      "Abdal al-Hadi AL-IRAQI"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": "Cuba",
    "dob": "1961"
  },
  {
    "fullName": "Thirwat Salah SHIHATA",
    "aliases": [
      "Tarwat Salah ABDALLAH",
      "Shahata THIRWAT",
      "Salah Shihata THIRWAT"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": null,
    "dob": "29 Jun 1960"
  },
  {
    "fullName": "Tariq Anwar al-Sayyid AHMAD",
    "aliases": [
      "Amr Al-Fatih FATHI",
      "Hamdi Ahmad FARAG"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": null,
    "dob": "15 Mar 1963"
  },
  {
    "fullName": "Abdullah Ahmed ABDULLAH",
    "aliases": [
      "ABU MARIAM",
      "Abu Mohamed AL-MASRI",
      "SALEH"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": "Afghanistan",
    "dob": "1963"
  },
  {
    "fullName": "Ahmed Mohammed Hamed ALI",
    "aliases": [
      "Ahmed Mohammed ABDUREHMAN",
      "ABU FATIMA",
      "ABU ISLAM",
      "ABU KHADIIJAH",
      "Ahmed AHMED",
      "AHMED HAMED",
      "AHMED THE EGYPTIAN",
      "Hamed ALI",
      "Ahmed Mohammed ALI",
      "Ahmad AL-MASRI",
      "Abu Islam AL-SURIR",
      "Ahmed HEMED",
      "Ahmed SHIEB",
      "SHUAIB"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": "Afghanistan",
    "dob": "1965"
  },
  {
    "fullName": "Ahmad Ibrahim AL-MUGHASSIL",
    "aliases": [
      "Ahmed Ibrahim AL-MUGHASSIL",
      "ABU OMRAN"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": null,
    "dob": "26 Jun 1967"
  },
  {
    "fullName": "Abdelkarim Hussein Mohamed AL-NASSER",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": null,
    "dob": null
  },
  {
    "fullName": "Ibrahim Salih Mohammed AL-YACOUB",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": null,
    "dob": "16 Oct 1966"
  },
  {
    "fullName": "Ali ATWA",
    "aliases": [
      "Ammar Mansour BOUSLIM",
      "Hassan Rostom SALIM"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": "Lebanon",
    "dob": "1960"
  },
  {
    "fullName": "Ali Saed Bin Ali EL-HOORIE",
    "aliases": [
      "Ali Saed Bin Ali AL-HOURI",
      "Ali Saed Bin Ali EL-HOURI"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "INDIVIDUAL",
    "programs": "SDGT",
    "nationality": null,
    "dob": "10 Jul 1965"
  },
  {
    "fullName": "AEROCARIBBEAN AIRLINES",
    "aliases": [
      "AERO-CARIBBEAN"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Cuba",
    "dob": null
  },
  {
    "fullName": "ANGLO-CARIBBEAN CO., LTD.",
    "aliases": [
      "AVIA IMPORT"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "United Kingdom",
    "dob": null
  },
  {
    "fullName": "BANCO NACIONAL DE CUBA",
    "aliases": [
      "BNC",
      "NATIONAL BANK OF CUBA"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Switzerland",
    "dob": null
  },
  {
    "fullName": "BOUTIQUE LA MAISON",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Panama",
    "dob": null
  },
  {
    "fullName": "CASA DE CUBA",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Spain",
    "dob": null
  },
  {
    "fullName": "CECOEX, S.A.",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Panama",
    "dob": null
  },
  {
    "fullName": "CIMEX",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Mexico",
    "dob": null
  },
  {
    "fullName": "CIMEX IBERICA",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Spain",
    "dob": null
  },
  {
    "fullName": "CIMEX, S.A.",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Panama",
    "dob": null
  },
  {
    "fullName": "COMERCIAL IBEROAMERICANA, S.A.",
    "aliases": [
      "COIBA"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Spain",
    "dob": null
  },
  {
    "fullName": "COMERCIAL CIMEX, S.A.",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Panama",
    "dob": null
  },
  {
    "fullName": "COMERCIAL DE RODAJES Y MAQUINARIA, S.A.",
    "aliases": [
      "CRYMSA"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Spain",
    "dob": null
  },
  {
    "fullName": "COMERCIALIZACION DE PRODUCTOS VARIOS",
    "aliases": [
      "COPROVA",
      "COPROVA SARL"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "France",
    "dob": null
  },
  {
    "fullName": "COMPANIA DE IMPORTACION Y EXPORTACION IBERIA",
    "aliases": [
      "CIMEX"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Spain",
    "dob": null
  },
  {
    "fullName": "CORPORACION CIMEX, S.A.",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Panama",
    "dob": null
  },
  {
    "fullName": "COTEI",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Italy",
    "dob": null
  },
  {
    "fullName": "CRYMSA - ARGENTINA, S.A.",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Argentina",
    "dob": null
  },
  {
    "fullName": "CUBACANCUN CIGARS AND GIFT SHOPS",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Mexico",
    "dob": null
  },
  {
    "fullName": "CUBAEXPORT",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Spain",
    "dob": null
  },
  {
    "fullName": "CUBAFRUTAS",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Spain",
    "dob": null
  },
  {
    "fullName": "CUBAN CIGARS TRADE",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Italy",
    "dob": null
  },
  {
    "fullName": "CUBANATUR",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Mexico",
    "dob": null
  },
  {
    "fullName": "CUBATABACO",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Spain",
    "dob": null
  },
  {
    "fullName": "CUMEXINT, S.A.",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Mexico",
    "dob": null
  },
  {
    "fullName": "DELVEST HOLDING, S.A.",
    "aliases": [
      "DELVEST HOLDING COMPANY"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Switzerland",
    "dob": null
  },
  {
    "fullName": "EDICIONES CUBANAS",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Spain",
    "dob": null
  },
  {
    "fullName": "EDYJU, S.A.",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Panama",
    "dob": null
  },
  {
    "fullName": "EMPRESA CUBANA DE AVIACION",
    "aliases": [
      "CUBANA AIRLINES"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Guyana",
    "dob": null
  },
  {
    "fullName": "EMPRESA CUBANA DE PESCADOS Y MARISCOS",
    "aliases": [
      "CARIBEX",
      "CARIBBEAN EXPORT ENTERPRISE"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "France",
    "dob": null
  },
  {
    "fullName": "EMPRESA DE TURISMO NACIONAL Y INTERNACIONAL",
    "aliases": [
      "CUBATUR"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Argentina",
    "dob": null
  },
  {
    "fullName": "ETCO INTERNATIONAL COMMODITIES LTD.",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "United Kingdom",
    "dob": null
  },
  {
    "fullName": "ETCO INTERNATIONAL COMPANY, LIMITED",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Japan",
    "dob": null
  },
  {
    "fullName": "GALAX TRADING CO., LTD.",
    "aliases": [
      "GALAX INC."
    ],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Canada",
    "dob": null
  },
  {
    "fullName": "HAVIN BANK LIMITED",
    "aliases": [
      "HAVANA INTERNATIONAL BANK, LTD"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "United Kingdom",
    "dob": null
  },
  {
    "fullName": "HAVANATUR",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "France",
    "dob": null
  },
  {
    "fullName": "INSTITUTO NACIONAL DE TURISMO DE CUBA",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Spain",
    "dob": null
  },
  {
    "fullName": "INTERCONSULT",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Panama",
    "dob": null
  },
  {
    "fullName": "KAVE, S.A.",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Panama",
    "dob": null
  },
  {
    "fullName": "LA EMPRESA CUBANA DE FLETES",
    "aliases": [
      "CUFLET",
      "CUBAN FREIGHT ENTERPRISE"
    ],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Korea, North",
    "dob": null
  },
  {
    "fullName": "LEVERAGE, S.A.",
    "aliases": [],
    "listSource": "OFAC_SDN",
    "entityType": "ENTITY",
    "programs": "CUBA",
    "nationality": "Argentina",
    "dob": null
  },
  {
    "fullName": "ERIC BADEGE",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": "Democratic Republic of the Congo",
    "dob": null
  },
  {
    "fullName": "FRANK KAKOLELE BWAMBALE",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": null,
    "dob": null
  },
  {
    "fullName": "GASTON IYAMUREMYE",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": null,
    "dob": null
  },
  {
    "fullName": "INNOCENT KAINA",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": null,
    "dob": null
  },
  {
    "fullName": "JÉRÔME KAKWAVU BUKANDE",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": "Democratic Republic of the Congo",
    "dob": null
  },
  {
    "fullName": "GERMAIN KATANGA",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": "Democratic Republic of the Congo",
    "dob": null
  },
  {
    "fullName": "THOMAS LUBANGA",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": "Democratic Republic of the Congo",
    "dob": null
  },
  {
    "fullName": "SULTANI MAKENGA",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": "Democratic Republic of the Congo",
    "dob": null
  },
  {
    "fullName": "KHAWA PANGA MANDRO",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": "Democratic Republic of the Congo",
    "dob": null
  },
  {
    "fullName": "CALLIXTE MBARUSHIMANA",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": "FDLR Executive Secretary",
    "dob": null
  },
  {
    "fullName": "IRUTA DOUGLAS MPAMO",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": "Democratic Republic of the Congo",
    "dob": null
  },
  {
    "fullName": "SYLVESTRE MUDACUMURA",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": null,
    "dob": null
  },
  {
    "fullName": "LEODOMIR MUGARAGU",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": "Rwanda",
    "dob": null
  },
  {
    "fullName": "LEOPOLD MUJYAMBERE",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": null,
    "dob": null
  },
  {
    "fullName": "JAMIL MUKULU",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": "Head of the Allied Democratic Forces (ADF)",
    "dob": null
  },
  {
    "fullName": "IGNACE MURWANASHYAKA",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": "Dr.",
    "dob": null
  },
  {
    "fullName": "STRATON MUSONI",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": null,
    "dob": null
  },
  {
    "fullName": "JULES MUTEBUTSI",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": "Democratic Republic of the Congo",
    "dob": null
  },
  {
    "fullName": "BAUDOIN NGARUYE WA MYAMURO",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": "Military leader of the Mouvement du 23 Mars (M23)",
    "dob": null
  },
  {
    "fullName": "MATHIEU, CHUI NGUDJOLO",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": "Democratic Republic of the Congo",
    "dob": null
  },
  {
    "fullName": "FLORIBERT NGABU NJABU",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": "Democratic Republic of the Congo",
    "dob": null
  },
  {
    "fullName": "LAURENT NKUNDA",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": "Democratic Republic of the Congo",
    "dob": null
  },
  {
    "fullName": "FELICIEN NSANZUBUKIRE",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": null,
    "dob": null
  },
  {
    "fullName": "PACIFIQUE NTAWUNGUKA",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": null,
    "dob": null
  },
  {
    "fullName": "JAMES NYAKUNI",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": "Uganda",
    "dob": null
  },
  {
    "fullName": "STANISLAS NZEYIMANA",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": null,
    "dob": null
  },
  {
    "fullName": "DIEUDONNÉ OZIA MAZIO",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": "Democratic Republic of the Congo",
    "dob": null
  },
  {
    "fullName": "JEAN-MARIE LUGERERO RUNIGA",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": null,
    "dob": null
  },
  {
    "fullName": "NTABO NTABERI SHEKA",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": null,
    "dob": null
  },
  {
    "fullName": "BOSCO TAGANDA",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": "Democratic Republic of the Congo",
    "dob": null
  },
  {
    "fullName": "INNOCENT ZIMURINDA",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": null,
    "dob": null
  },
  {
    "fullName": "MUHINDO AKILI MUNDOS",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": null,
    "dob": null
  },
  {
    "fullName": "GUIDON SHIMIRAY MWISSA",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": "UN List",
    "dob": null
  },
  {
    "fullName": "LUCIEN NZAMBAMWITA",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": "Rwanda",
    "dob": null
  },
  {
    "fullName": "GÉDÉON KYUNGU MUTANGA WA BAFUNKWA",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": "Katangan rebel leader",
    "dob": null
  },
  {
    "fullName": "SEKA BALUKU",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": "Overall leader of the Allied Democratic Forces (ADF)\n                (CDe.001).",
    "dob": null
  },
  {
    "fullName": "PROTOGÈNE RUVUGAYIMIKORE",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": null,
    "dob": null
  },
  {
    "fullName": "BERNARD MAHESHE BYAMUNGU",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": null,
    "dob": null
  },
  {
    "fullName": "APOLLINAIRE HAKIZIMANA",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": null,
    "dob": null
  },
  {
    "fullName": "AHMAD MAHMOOD HASSAN",
    "aliases": [],
    "listSource": "UN_CONSOLIDATED",
    "entityType": "INDIVIDUAL",
    "programs": "DRC",
    "nationality": null,
    "dob": null
  }
];
