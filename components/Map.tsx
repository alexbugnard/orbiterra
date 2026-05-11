'use client'

const PHOTO_ZOOM_THRESHOLD = 9
const WEATHER_ZOOM_THRESHOLD = 7

// Switzerland border — ~55-point polygon [lat, lng], clockwise from westernmost
const SWITZERLAND_POLY: [number, number][] = [
  [46.864427,10.453811],[46.832233,10.44854],[46.823241,10.444923],[46.816885,10.439032],[46.79885,10.417224],[46.783967,10.419085],[46.76942,10.426216],[46.755648,10.428696],[46.743014,10.416604],[46.735546,10.399654],[46.7264,10.395623],[46.715005,10.396554],[46.70082,10.394383],[46.689012,10.384771],[46.681906,10.373919],[46.672398,10.369165],[46.653277,10.377537],[46.638808,10.395623],[46.635656,10.438205],[46.623564,10.459082],[46.604288,10.466627],[46.578476,10.465903],[46.553697,10.457945],[46.546702,10.451833],[46.537729,10.443993],[46.535326,10.425906],[46.548323,10.354282],[46.546049,10.319452],[46.547496,10.306637],[46.551087,10.295371],[46.555687,10.289067],[46.560725,10.283796],[46.565531,10.275941],[46.575298,10.234703],[46.58615,10.230259],[46.606691,10.235737],[46.617982,10.233773],[46.626974,10.217856],[46.626819,10.192122],[46.608035,10.09745],[46.604392,10.087839],[46.597002,10.083498],[46.564394,10.071199],[46.556746,10.062931],[46.541863,10.04133],[46.532975,10.032752],[46.525792,10.031408],[46.503829,10.031201],[46.493184,10.02686],[46.483934,10.028101],[46.476673,10.030478],[46.471066,10.035335],[46.466984,10.044017],[46.446262,10.026344],[46.432722,10.042053],[46.424816,10.071405],[46.418822,10.116157],[46.414016,10.133417],[46.402905,10.140755],[46.381098,10.13321],[46.37438,10.125976],[46.361357,10.104995],[46.351642,10.09745],[46.338103,10.092386],[46.328956,10.091766],[46.320533,10.095797],[46.309371,10.104892],[46.280277,10.14613],[46.262449,10.158945],[46.243328,10.14582],[46.231133,10.117914],[46.220022,10.075746],[46.220487,10.042673],[46.24307,10.041847],[46.260072,10.031718],[46.284359,9.992237],[46.298105,9.977561],[46.320016,9.97105],[46.339808,9.970636],[46.356086,9.964022],[46.367455,9.93901],[46.37115,9.918443],[46.372158,9.899013],[46.366964,9.855398],[46.343296,9.788839],[46.33862,9.768065],[46.340532,9.755249],[46.350712,9.730858],[46.350893,9.720109],[46.342392,9.709257],[46.330972,9.707293],[46.319629,9.708844],[46.311748,9.70843],[46.297072,9.693134],[46.291801,9.674324],[46.292731,9.559705],[46.298622,9.536451],[46.308596,9.515264],[46.32074,9.502551],[46.35681,9.482604],[46.361874,9.473716],[46.370375,9.451598],[46.375284,9.444364],[46.380891,9.4424],[46.396136,9.443847],[46.492047,9.437852],[46.498326,9.434648],[46.497111,9.426794],[46.488895,9.410671],[46.482513,9.403849],[46.475407,9.400335],[46.469413,9.395478],[46.466416,9.384626],[46.468689,9.377081],[46.485484,9.351553],[46.497861,9.350829],[46.501504,9.330986],[46.49737,9.282306],[46.485122,9.263186],[46.461041,9.245823],[46.436547,9.237968],[46.423033,9.24758],[46.416651,9.260912],[46.406626,9.262876],[46.394017,9.260292],[46.379728,9.260396],[46.344252,9.273831],[46.331385,9.275175],[46.309371,9.268974],[46.266996,9.239725],[46.231184,9.224842],[46.221056,9.215747],[46.213563,9.204172],[46.209635,9.192183],[46.204054,9.181331],[46.194132,9.17575],[46.182609,9.171099],[46.172989,9.163788],[46.172273,9.163244],[46.138167,9.090587],[46.118892,9.072087],[46.105972,9.068159],[46.083441,9.07033],[46.071142,9.067126],[46.061789,9.059168],[46.057913,9.049659],[46.053107,9.027748],[46.03931,9.002117],[46.027941,8.997776],[45.993111,9.015553],[45.971975,8.982686],[45.969495,8.980516],[45.966911,8.979793],[45.964379,8.980516],[45.961847,8.982686],[45.95425,8.993435],[45.93606,9.001703],[45.926655,9.010798],[45.922779,9.020514],[45.919731,9.042321],[45.915545,9.051726],[45.898957,9.063095],[45.881955,9.059271],[45.848107,9.034363],[45.820718,9.002427],[45.824646,8.972351],[45.834826,8.939588],[45.826403,8.900004],[45.841802,8.903725],[45.853688,8.909719],[45.86609,8.91375],[45.883402,8.912096],[45.896476,8.906515],[45.90955,8.898144],[45.931099,8.88078],[45.947067,8.870962],[45.953424,8.864451],[45.957093,8.857733],[45.978538,8.800372],[45.982311,8.785076],[45.983086,8.767919],[45.985773,8.769573],[45.990579,8.773397],[46.018691,8.790967],[46.042927,8.819596],[46.066388,8.834375],[46.089746,8.80895],[46.093415,8.793861],[46.092898,8.763165],[46.094449,8.747145],[46.098066,8.739497],[46.107419,8.732159],[46.108233,8.728983],[46.109538,8.723891],[46.107523,8.71769],[46.097963,8.702187],[46.095172,8.695055],[46.095792,8.677485],[46.114706,8.630873],[46.119357,8.611546],[46.122819,8.601831],[46.187621,8.538682],[46.207878,8.51026],[46.217542,8.482665],[46.224828,8.456517],[46.23537,8.43812],[46.251442,8.427165],[46.275833,8.423237],[46.301568,8.426648],[46.353373,8.442874],[46.382183,8.446285],[46.412362,8.445768],[46.434945,8.441634],[46.44869,8.427888],[46.452179,8.399156],[46.450206,8.385907],[46.443885,8.343449],[46.433653,8.316267],[46.418046,8.294976],[46.40536,8.286605],[46.401122,8.290429],[46.397634,8.297043],[46.387506,8.297457],[46.378359,8.291462],[46.370116,8.281541],[46.364044,8.270068],[46.354123,8.24175],[46.309164,8.192554],[46.299191,8.171883],[46.292473,8.128475],[46.285548,8.106874],[46.271802,8.087341],[46.262035,8.077315],[46.253612,8.073078],[46.249736,8.076592],[46.235629,8.09995],[46.196044,8.129509],[46.159354,8.132299],[46.126953,8.110595],[46.100598,8.066877],[46.098066,8.056025],[46.096516,8.035354],[46.091141,8.025329],[46.080858,8.018197],[46.069385,8.016027],[46.058172,8.015924],[46.029698,8.010653],[46.027683,8.008792],[46.0128,7.999077],[46.010629,7.998354],[45.999312,7.985848],[45.995178,7.978717],[45.993111,7.969105],[45.981949,7.898205],[45.973869,7.883782],[45.959383,7.872917],[45.94037,7.870201],[45.939712,7.84962],[45.938076,7.848389],[45.927792,7.845288],[45.922573,7.846115],[45.919214,7.843738],[45.91446,7.831232],[45.914666,7.825444],[45.91849,7.807564],[45.918129,7.780072],[45.930376,7.732013],[45.929601,7.722195],[45.92712,7.71465],[45.925725,7.706279],[45.928671,7.69398],[45.931203,7.692533],[45.950323,7.673722],[45.960038,7.658736],[45.966343,7.643027],[45.984119,7.541121],[45.978073,7.524377],[45.966704,7.514662],[45.956731,7.503707],[45.954871,7.482726],[45.945879,7.452961],[45.9157,7.393843],[45.907845,7.361803],[45.913426,7.286666],[45.910274,7.27354],[45.89813,7.245428],[45.880456,7.183726],[45.876529,7.153547],[45.876116,7.120888],[45.880508,7.090192],[45.890223,7.066938],[45.92526,7.022083],[45.933321,7.015158],[45.943398,7.009784],[45.961692,7.002756],[45.982466,6.991283],[45.993111,6.987666],[45.995385,6.982808],[46.048612,6.915112],[46.055588,6.892375],[46.053211,6.884003],[46.048095,6.876872],[46.044064,6.869224],[46.044994,6.859715],[46.049645,6.85093],[46.052746,6.85031],[46.056931,6.852377],[46.064683,6.851964],[46.065665,6.853411],[46.076103,6.853101],[46.086025,6.851344],[46.085043,6.848553],[46.090211,6.853101],[46.097032,6.861162],[46.10468,6.86819],[46.112329,6.869224],[46.122612,6.853927],[46.134808,6.774346],[46.151603,6.765664],[46.185864,6.774863],[46.221676,6.792226],[46.269477,6.827676],[46.296607,6.804938],[46.322678,6.769488],[46.345518,6.750368],[46.357068,6.755742],[46.378462,6.782097],[46.395205,6.789229],[46.405008,6.788107],[46.414171,6.787058],[46.424106,6.777716],[46.42926,6.762667],[46.455899,6.613684],[46.457372,6.547021],[46.448587,6.482942],[46.408176,6.397676],[46.40244,6.365223],[46.401381,6.332357],[46.394482,6.301558],[46.375026,6.269105],[46.348955,6.24058],[46.329111,6.219496],[46.315469,6.214122],[46.305495,6.218256],[46.288494,6.227454],[46.284463,6.227971],[46.267926,6.237583],[46.263689,6.24182],[46.259916,6.252259],[46.265239,6.269002],[46.26312,6.27603],[46.240073,6.281198],[46.221107,6.255359],[46.191704,6.191384],[46.150207,6.140328],[46.138632,6.107875],[46.149174,6.073872],[46.147934,6.028293],[46.140441,5.982921],[46.130467,5.95884],[46.152171,5.972172],[46.162248,5.979821],[46.170826,5.982921],[46.186226,5.965248],[46.19992,5.954809],[46.211961,5.95853],[46.222709,5.982921],[46.24307,6.042866],[46.243432,6.044519],[46.243535,6.046173],[46.243432,6.048033],[46.241675,6.055888],[46.241158,6.061883],[46.241623,6.067671],[46.246377,6.089685],[46.253044,6.094026],[46.262294,6.093095],[46.273094,6.093612],[46.301413,6.100743],[46.309216,6.104051],[46.331771,6.118607],[46.359342,6.1364],[46.370401,6.135057],[46.385542,6.122861],[46.396497,6.108185],[46.417383,6.059019],[46.419416,6.054235],[46.427012,6.065707],[46.433601,6.067567],[46.440371,6.0655],[46.447993,6.0655],[46.451068,6.064777],[46.455202,6.0624],[46.459904,6.060229],[46.46502,6.060229],[46.471118,6.064157],[46.479593,6.075525],[46.520831,6.110355],[46.55163,6.145702],[46.570285,6.121517],[46.583463,6.118417],[46.595607,6.131853],[46.680356,6.266315],[46.707409,6.337938],[46.71317,6.34786],[46.733609,6.374215],[46.745701,6.407391],[46.751101,6.417933],[46.760816,6.429199],[46.76911,6.433023],[46.785983,6.432609],[46.791615,6.425168],[46.796525,6.419897],[46.802157,6.417107],[46.807015,6.418554],[46.839545,6.434263],[46.848149,6.441188],[46.851455,6.443118],[46.857709,6.446769],[46.871559,6.448422],[46.882617,6.445219],[46.900032,6.431886],[46.909076,6.427752],[46.944164,6.442635],[46.963388,6.491107],[46.986539,6.598698],[47.021291,6.665412],[47.043848,6.688253],[47.0624,6.676264],[47.07829,6.6897],[47.084621,6.699105],[47.09077,6.72422],[47.097126,6.72794],[47.098883,6.731661],[47.103948,6.746027],[47.121053,6.744787],[47.128184,6.774759],[47.168132,6.838076],[47.169525,6.840285],[47.190919,6.859302],[47.211305,6.888344],[47.245231,6.956247],[47.270036,6.952216],[47.290551,6.958624],[47.303729,6.977434],[47.304504,6.986529],[47.305951,6.991904],[47.319361,7.006476],[47.323521,7.016915],[47.325433,7.027147],[47.329515,7.036552],[47.340497,7.044303],[47.350651,7.033865],[47.359901,7.018879],[47.368143,7.003996],[47.362123,6.985599],[47.354165,6.86664],[47.366955,6.871601],[47.382587,6.884003],[47.395713,6.898783],[47.405996,6.924517],[47.424858,6.926068],[47.428837,6.952319],[47.435194,6.968546],[47.443798,6.983429],[47.452221,6.990973],[47.464132,6.986116],[47.477956,6.97578],[47.489092,6.9733],[47.492942,6.991904],[47.49767,7.000792],[47.499247,7.009784],[47.49767,7.018879],[47.492942,7.027974],[47.490384,7.053915],[47.496275,7.103731],[47.492942,7.127296],[47.487852,7.140318],[47.487651,7.142169],[47.486405,7.153651],[47.488265,7.180833],[47.459895,7.162642],[47.443565,7.168327],[47.434728,7.190031],[47.428476,7.219383],[47.426228,7.223517],[47.422636,7.226308],[47.419019,7.230339],[47.416797,7.23809],[47.417727,7.244808],[47.428889,7.282635],[47.432661,7.309093],[47.431854,7.33693],[47.430646,7.378547],[47.433289,7.388219],[47.438242,7.406349],[47.450857,7.420563],[47.455761,7.426089],[47.465114,7.429293],[47.470747,7.427639],[47.475424,7.422782],[47.477852,7.419474],[47.484028,7.41441],[47.490177,7.414307],[47.492503,7.425986],[47.488834,7.441488],[47.486884,7.445996],[47.483201,7.454511],[47.481909,7.46743],[47.491263,7.482726],[47.492942,7.484483],[47.495784,7.485827],[47.498394,7.48593],[47.498768,7.485776],[47.5009,7.484897],[47.507696,7.477765],[47.511726,7.475595],[47.514879,7.476939],[47.516997,7.482726],[47.515499,7.493062],[47.517307,7.501123],[47.523018,7.505464],[47.533017,7.505154],[47.532965,7.501743],[47.541595,7.485103],[47.542267,7.482726],[47.563416,7.520867],[47.566452,7.526341],[47.575495,7.550319],[47.584479,7.585483],[47.584619,7.586028],[47.594977,7.637032],[47.596579,7.659666],[47.571542,7.646541],[47.564591,7.635895],[47.564731,7.612337],[47.564746,7.609747],[47.551445,7.646901],[47.546246,7.661423],[47.544257,7.683438],[47.550423,7.72732],[47.555961,7.76674],[47.563196,7.78555],[47.576089,7.801467],[47.595339,7.819657],[47.590481,7.833713],[47.587846,7.898205],[47.583557,7.904303],[47.574177,7.907507],[47.564798,7.90947],[47.560561,7.912157],[47.560561,8.042279],[47.567382,8.087237],[47.571852,8.096952],[47.576193,8.101397],[47.581257,8.105427],[47.587846,8.113902],[47.592135,8.122067],[47.600067,8.143771],[47.603762,8.162065],[47.608646,8.168886],[47.613529,8.173847],[47.615803,8.179015],[47.621952,8.232965],[47.622004,8.251051],[47.61663,8.276993],[47.615803,8.288569],[47.611462,8.293943],[47.601824,8.299317],[47.592187,8.306345],[47.587846,8.316164],[47.581024,8.354094],[47.580766,8.41807],[47.581112,8.4211],[47.58428,8.448869],[47.589034,8.450109],[47.606139,8.461788],[47.619833,8.49238],[47.621901,8.522353],[47.612134,8.537752],[47.598594,8.549638],[47.596863,8.551719],[47.589396,8.560697],[47.592445,8.574133],[47.595023,8.576305],[47.600171,8.580644],[47.607664,8.581781],[47.614769,8.581264],[47.62159,8.582504],[47.625027,8.582091],[47.628929,8.579714],[47.633476,8.57806],[47.639005,8.580334],[47.641124,8.583951],[47.642468,8.589222],[47.642571,8.593563],[47.640969,8.594493],[47.63482,8.595113],[47.632598,8.601624],[47.656291,8.607309],[47.656885,8.598214],[47.658169,8.593589],[47.66133,8.582194],[47.662932,8.568241],[47.657351,8.519666],[47.65226,8.504679],[47.645568,8.49083],[47.640401,8.476051],[47.639884,8.458274],[47.647842,8.437603],[47.661045,8.411972],[47.661562,8.407011],[47.665464,8.391301],[47.67629,8.397709],[47.684817,8.395229],[47.692129,8.390991],[47.699519,8.392128],[47.707089,8.401947],[47.716468,8.427268],[47.723186,8.437913],[47.743185,8.445458],[47.750471,8.450109],[47.763907,8.463648],[47.76706,8.471503],[47.766853,8.482665],[47.774088,8.536512],[47.779255,8.551602],[47.795017,8.5423],[47.801166,8.558216],[47.800236,8.583124],[47.794603,8.601624],[47.787317,8.603175],[47.774398,8.604105],[47.762254,8.607619],[47.757319,8.617437],[47.762796,8.62984],[47.784604,8.635007],[47.791012,8.644102],[47.788118,8.657022],[47.778273,8.666633],[47.766698,8.674488],[47.75874,8.68193],[47.757164,8.692265],[47.758714,8.703324],[47.757422,8.713142],[47.747319,8.719757],[47.743547,8.71707],[47.730033,8.703737],[47.723496,8.70043],[47.715332,8.704667],[47.708691,8.712625],[47.701069,8.715106],[47.694558,8.71707],[47.695074,8.769883],[47.70125,8.761718],[47.720861,8.77071],[47.720034,8.797581],[47.707192,8.830241],[47.690682,8.856079],[47.687788,8.837682],[47.680838,8.837786],[47.671282,8.851935],[47.670786,8.852668],[47.656136,8.881711],[47.651795,8.906205],[47.654302,8.945376],[47.662156,8.981756],[47.673835,8.997673],[47.6789,9.016586],[47.670425,9.128104],[47.670425,9.183398],[47.656136,9.196937],[47.656162,9.234351],[47.65009,9.273211],[47.534547,9.547482],[47.516891,9.553059],[47.5109,9.554951],[47.480721,9.58451],[47.469197,9.621717],[47.452092,9.650346],[47.409717,9.649519],[47.394524,9.639804],[47.36127,9.601047],[47.352305,9.596396],[47.334683,9.591228],[47.32781,9.587404],[47.299853,9.553298],[47.262801,9.521155],[47.243732,9.504618],[47.210014,9.487358],[47.176346,9.484981],[47.15981,9.492629],[47.145392,9.503481],[47.129372,9.511853],[47.10803,9.51237],[47.094698,9.502861],[47.083949,9.487565],[47.073226,9.475886],[47.063898,9.477023],[47.059351,9.499554],[47.0524,9.560636],[47.05687,9.581203],[47.053486,9.59991],[47.05793,9.65231],[47.056199,9.669053],[47.015478,9.857982],[47.004083,9.856328],[47.001602,9.860566],[47.001938,9.866767],[46.998838,9.870591],[46.992947,9.870591],[46.983387,9.866457],[46.959925,9.863976],[46.949151,9.860772],[46.939772,9.862426],[46.927421,9.875138],[46.914398,9.899943],[46.890757,10.006913],[46.865564,10.045567],[46.856624,10.068098],[46.847116,10.1113],[46.846751,10.125188],[46.846573,10.13197],[46.851612,10.157808],[46.86683,10.201423],[46.877036,10.211655],[46.884685,10.214342],[46.893108,10.215169],[46.905769,10.219924],[46.923313,10.235116],[46.92538,10.251343],[46.921892,10.270773],[46.922693,10.295681],[46.941374,10.296198],[46.964318,10.313665],[46.98411,10.338883],[46.995505,10.367925],[46.996254,10.373403],[46.995505,10.378984],[46.993153,10.384255],[46.993153,10.384358],[46.992998,10.384358],[46.985402,10.394693],[46.962406,10.415571],[46.943906,10.449574],[46.936619,10.458462],[46.919747,10.463836],[46.88577,10.451434],[46.864427,10.453811],
]
const SWITZERLAND_CENTROID: [number, number] = [46.80, 8.23]

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Map as LeafletMap, Polyline } from 'leaflet'
import { useTranslations } from 'next-intl'
import { PhotoModal } from './PhotoModal'
import { ElevationProfile } from './ElevationProfile'
import { useIsMobile } from '@/lib/useIsMobile'
import { computeElevationGain } from '@/lib/strava'
import { WeatherLayer } from './WeatherLayer'
import { SponsorBanner } from './SponsorBanner'
import { LocalTime } from './LocalTime'

interface Trip {
  id: string
  name: string
  start_date: string
  distance_m: number
  journal_fr: string | null
  journal_en: string | null
  coordinates: [number, number][]
  elevation: [number, number][] | null
  country?: string | null
  max_speed_ms: number | null
  elev_high: number | null
  breaks: { lat: number; lng: number; duration_min: number; distance_m: number }[] | null
  max_speed_lat: number | null
  max_speed_lng: number | null
  elev_high_lat: number | null
  elev_high_lng: number | null
  youtube_ids?: string[]
}

interface Waypoint {
  id: string
  lat: number
  lng: number
  url_large: string
  title: string | null
}

interface PlannedRoute {
  id: string
  name: string
  coordinates: [number, number][]
  color: string
  elevation: [number, number][] | null
  countries: [number, string][] | null
}

interface Video {
  id: string
  youtube_id: string
  title: string
  published_at: string | null
}

interface ExternalHover {
  distance: number | null
  onDistance: (d: number | null) => void
}

interface Stats {
  rides: number
  totalKm: number
  totalElevationGain: number
  countries: number
  progress: { pct: number; kmLeft: number; totalKm: number } | null
  labels: {
    rides: string
    distance: string
    km: string
    elevation: string
    countries: string
    americasCrossing: string
    left: string
  }
}

interface MapProps {
  trips: Trip[]
  waypoints: Waypoint[]
  plannedRoutes: PlannedRoute[]
  videos: Video[]
  locale: string
  externalHover?: ExternalHover
  stats?: Stats | null
  currentTz?: string | null
  vincentLat?: number | null
  vincentLng?: number | null
  vincentLastDate?: string | null
  routeCities?: RouteCity[]
  routePois?: RoutePoi[]
}

interface RouteCity {
  id: string
  name: string
  country: string
  lat: number
  lng: number
  wiki_slug: string
}

interface RoutePoi {
  id: string
  name: string
  country: string
  lat: number
  lng: number
  wiki_slug: string
  type: 'mountain' | 'pass' | 'lake'
}

interface WikiTarget {
  name: string
  country: string
  wiki_slug: string
}

interface WikiSummary {
  title: string
  extract: string
  thumbnail?: { source: string }
  content_urls?: { desktop: { page: string } }
}

function toDateStr(iso: string) {
  return iso.slice(0, 10) // "YYYY-MM-DD"
}

// ── Geo utilities ──────────────────────────────────────────────────────────────

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// coords: [lng, lat][]
function buildCumDists(coords: [number, number][]): number[] {
  const dists: number[] = [0]
  for (let i = 1; i < coords.length; i++) {
    const [lng1, lat1] = coords[i - 1]
    const [lng2, lat2] = coords[i]
    dists.push(dists[i - 1] + haversineM(lat1, lng1, lat2, lng2))
  }
  return dists
}

// Returns [lat, lng] for Leaflet
function interpolateOnPath(
  coords: [number, number][],
  cumDists: number[],
  dist: number
): [number, number] | null {
  if (coords.length === 0) return null
  const total = cumDists[cumDists.length - 1]
  if (dist <= 0) return [coords[0][1], coords[0][0]]
  if (dist >= total) {
    const last = coords[coords.length - 1]
    return [last[1], last[0]]
  }
  for (let i = 1; i < cumDists.length; i++) {
    if (cumDists[i] >= dist) {
      const t = (dist - cumDists[i - 1]) / (cumDists[i] - cumDists[i - 1])
      const [lng1, lat1] = coords[i - 1]
      const [lng2, lat2] = coords[i]
      return [lat1 + t * (lat2 - lat1), lng1 + t * (lng2 - lng1)]
    }
  }
  return null
}

function closestDistOnPath(
  mouseLat: number,
  mouseLng: number,
  coords: [number, number][],
  cumDists: number[]
): number {
  let bestDist = Infinity
  let bestCum = 0

  for (let i = 0; i < coords.length - 1; i++) {
    const [lng1, lat1] = coords[i]
    const [lng2, lat2] = coords[i + 1]

    // Project mouse onto segment [p1, p2] in lat/lng space
    const dx = lng2 - lng1
    const dy = lat2 - lat1
    const lenSq = dx * dx + dy * dy

    let t = 0
    if (lenSq > 0) {
      t = ((mouseLng - lng1) * dx + (mouseLat - lat1) * dy) / lenSq
      t = Math.max(0, Math.min(1, t))
    }

    const projLng = lng1 + t * dx
    const projLat = lat1 + t * dy
    const d = haversineM(mouseLat, mouseLng, projLat, projLng)

    if (d < bestDist) {
      bestDist = d
      bestCum = cumDists[i] + t * (cumDists[i + 1] - cumDists[i])
    }
  }

  return bestCum
}

function computeRiddenMask(planCoords: [number, number][], trips: { coordinates: [number, number][] }[]): boolean[] {
  const CELL = 0.005
  const riddenCells = new Set<string>()
  for (const trip of trips) {
    for (const [lng, lat] of trip.coordinates) {
      riddenCells.add(`${Math.floor(lat / CELL)},${Math.floor(lng / CELL)}`)
    }
  }
  // Smooth mask with window=3 to avoid tiny isolated ridden blips
  const raw = planCoords.map(([lng, lat]) => {
    const cLat = Math.floor(lat / CELL)
    const cLng = Math.floor(lng / CELL)
    for (let dLat = -1; dLat <= 1; dLat++) {
      for (let dLng = -1; dLng <= 1; dLng++) {
        if (riddenCells.has(`${cLat + dLat},${cLng + dLng}`)) return true
      }
    }
    return false
  })
  // Smooth: if majority of window=5 neighbors are true, mark true
  const W = 5
  return raw.map((_, i) => {
    let count = 0
    for (let j = Math.max(0, i - W); j <= Math.min(raw.length - 1, i + W); j++) {
      if (raw[j]) count++
    }
    return count > W
  })
}

function splitRiddenSegments(
  coords: [number, number][],
  mask: boolean[]
): { coords: [number, number][]; ridden: boolean }[] {
  if (coords.length === 0) return []
  const segs: { coords: [number, number][]; ridden: boolean }[] = []
  let cur = mask[0]
  let buf: [number, number][] = [coords[0]]
  for (let i = 1; i < coords.length; i++) {
    if (mask[i] === cur) {
      buf.push(coords[i])
    } else {
      segs.push({ coords: buf, ridden: cur })
      cur = mask[i]
      buf = [coords[i - 1], coords[i]]
    }
  }
  segs.push({ coords: buf, ridden: cur })
  return segs
}

function computeRouteDistances(coords: [number, number][]): { ridden: number; total: number } {
  // Returns total distance (all) — ridden distance computed from mask elsewhere
  let total = 0
  for (let i = 1; i < coords.length; i++) {
    const [lng1, lat1] = coords[i - 1]
    const [lng2, lat2] = coords[i]
    total += haversineM(lat1, lng1, lat2, lng2)
  }
  return { ridden: 0, total }
}

function computeRiddenDistM(coords: [number, number][], mask: boolean[]): number {
  let lastIdx = -1
  for (let i = 0; i < mask.length; i++) {
    if (mask[i]) lastIdx = i
  }
  if (lastIdx < 0) return 0
  let d = 0
  for (let i = 1; i <= lastIdx; i++) {
    const [lng1, lat1] = coords[i - 1]
    const [lng2, lat2] = coords[i]
    d += haversineM(lat1, lng1, lat2, lng2)
  }
  return d
}

// ──────────────────────────────────────────────────────────────────────────────

export function Map({ trips, waypoints, plannedRoutes, videos, locale, externalHover, stats, currentTz, vincentLat, vincentLng, vincentLastDate, routeCities = [], routePois = [] }: MapProps) {
  const t = useTranslations('map')
  const vincentMarkerLabel = t('vincentMarkerLabel')
  const vincentLastSeenLabel = t('vincentLastSeen')
  const isMobile = useIsMobile()
  const mapRef = useRef<LeafletMap | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const polylinesRef = useRef<Polyline[]>([])
  const selectedTripIndexRef = useRef<number | null>(null)
  const hoverMarkerRef = useRef<any>(null)
  const cumDistsRef = useRef<number[] | null>(null)
  const weatherLayerRef = useRef<WeatherLayer | null>(null)
  const waypointMarkersRef = useRef<any[]>([])
  const [showWeather, setShowWeather] = useState(false)
  const [basemap, setBasemap] = useState<'dark' | 'topo'>('dark')
  const [mapZoom, setMapZoom] = useState(6)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null)
  const [routeElevation, setRouteElevation] = useState<[number, number][] | null>(null)
  const [routeElevationLoading, setRouteElevationLoading] = useState(false)
  const routeElevationCache = useRef<Record<string, [number, number][]>>({})

  useEffect(() => {
    function handler(e: Event) {
      setAboutOpen((e as CustomEvent).detail.open)
    }
    window.addEventListener('aboutmodal', handler)
    return () => window.removeEventListener('aboutmodal', handler)
  }, [])
  const tileLayerRef = useRef<any>(null)
  const plannedLinesRef = useRef<{ segLines: { line: any; ridden: boolean }[]; routeColor: string }[]>([])
  const breakMarkersRef = useRef<any[]>([])
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
  const [selectedTripIndex, setSelectedTripIndex] = useState<number | null>(null)
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)
  const [mapVideoModal, setMapVideoModal] = useState<string | null>(null)
  const [hoveredDistance, setHoveredDistance] = useState<number | null>(null)
  const [journalExpanded, setJournalExpanded] = useState(false)
  const [journalLong, setJournalLong] = useState(false)
  const journalRef = useRef<HTMLParagraphElement>(null)
  const [hoveredRouteDistance, setHoveredRouteDistance] = useState<number | null>(null)
  const [wikiTarget, setWikiTarget] = useState<WikiTarget | null>(null)
  const [wikiSummary, setWikiSummary] = useState<WikiSummary | null>(null)
  const [wikiLoading, setWikiLoading] = useState(false)
  const hoverRouteMarkerRef = useRef<any>(null)
  const selectedRouteIndexRef = useRef<number | null>(null)
  const routeCumDistsRef = useRef<number[] | null>(null)

  // Measurement tool
  const [measureActive, setMeasureActive] = useState(false)
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([])
  const [measureDistance, setMeasureDistance] = useState(0)
  const measureActiveRef = useRef(false)
  const measureDrawingRef = useRef(false) // true = actively placing points, false = finalized
  const measurePointsRef = useRef<[number, number][]>([])
  const measurePolylineRef = useRef<any>(null)
  const measureRubberRef = useRef<any>(null)
  const measureMarkersRef = useRef<any[]>([])

  // Geo tools panel
  const [geoToolsOpen, setGeoToolsOpen] = useState(false)

  // True size tool
  const [trueSizeActive, setTrueSizeActive] = useState(false)
  const trueSizeLayerRef = useRef<any>(null)
  const trueSizeOffsetRef = useRef<[number, number]>([0, 0])

  // Keep setters in refs so Leaflet closures (initMap) can access current values
  const setHoveredDistanceRef = useRef(setHoveredDistance)
  const setHoveredRouteDistanceRef = useRef(setHoveredRouteDistance)
  const externalHoverRef = useRef(externalHover)
  useEffect(() => {
    setHoveredDistanceRef.current = setHoveredDistance
    setHoveredRouteDistanceRef.current = setHoveredRouteDistance
    externalHoverRef.current = externalHover
  })

  // Sync measure refs so Leaflet closures stay current
  useEffect(() => {
    measureActiveRef.current = measureActive
  })

  function haversineMeasureKm(a: [number, number], b: [number, number]) {
    const R = 6371
    const dLat = (b[0] - a[0]) * Math.PI / 180
    const dLng = (b[1] - a[1]) * Math.PI / 180
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
  }

  function totalKmFromPoints(pts: [number, number][]) {
    let d = 0
    for (let i = 1; i < pts.length; i++) d += haversineMeasureKm(pts[i - 1], pts[i])
    return d
  }

  // Expand a pair of lat/lng points into a great circle arc (geodesic interpolation)
  function geodesicArc(a: [number, number], b: [number, number], steps = 64): [number, number][] {
    const toRad = (v: number) => v * Math.PI / 180
    const toDeg = (v: number) => v * 180 / Math.PI
    const lat1 = toRad(a[0]), lng1 = toRad(a[1])
    const lat2 = toRad(b[0]), lng2 = toRad(b[1])
    const x1 = Math.cos(lat1) * Math.cos(lng1), y1 = Math.cos(lat1) * Math.sin(lng1), z1 = Math.sin(lat1)
    const x2 = Math.cos(lat2) * Math.cos(lng2), y2 = Math.cos(lat2) * Math.sin(lng2), z2 = Math.sin(lat2)
    const dot = Math.min(1, Math.max(-1, x1*x2 + y1*y2 + z1*z2))
    const angle = Math.acos(dot)
    if (angle < 1e-6) return [a, b]
    const sinA = Math.sin(angle)
    const result: [number, number][] = []
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const s1 = Math.sin((1 - t) * angle) / sinA
      const s2 = Math.sin(t * angle) / sinA
      const x = s1*x1 + s2*x2, y = s1*y1 + s2*y2, z = s1*z1 + s2*z2
      result.push([toDeg(Math.atan2(z, Math.sqrt(x*x + y*y))), toDeg(Math.atan2(y, x))])
    }
    return result
  }

  // Expand all segments of a path into geodesic arcs
  function geodesicPath(pts: [number, number][]): [number, number][] {
    if (pts.length < 2) return pts
    const result: [number, number][] = []
    for (let i = 0; i < pts.length - 1; i++) {
      const arc = geodesicArc(pts[i], pts[i + 1])
      if (i > 0) arc.shift() // avoid duplicating shared points
      result.push(...arc)
    }
    return result
  }

  // Measurement tool: click + mousemove handlers wired to map
  useEffect(() => {
    const L = (window as any)._L
    if (!L) return

    function setup() {
      const map = mapRef.current as NonNullable<typeof mapRef.current>
      if (!map) return

      if (!measureActive) {
        // Full cleanup — remove all measure layers
        measurePolylineRef.current?.remove(); measurePolylineRef.current = null
        measureRubberRef.current?.remove(); measureRubberRef.current = null
        measureMarkersRef.current.forEach(m => m.remove()); measureMarkersRef.current = [];
        (map.getContainer?.() ?? document.body).style.cursor = ''
        return
      }

      measureDrawingRef.current = true;
      (map.getContainer?.() ?? document.body).style.cursor = 'crosshair'

      function finalize() {
        measureDrawingRef.current = false
        measureRubberRef.current?.remove(); measureRubberRef.current = null
        map.off('click', onMapClick)
        map.off('mousemove', onMouseMove)
        map.off('dblclick', onDblClick)
        window.removeEventListener('keydown', onKeyDown);
        (map.getContainer?.() ?? document.body).style.cursor = ''
        // Redraw final polyline without rubber band
        const pts = measurePointsRef.current
        setMeasureDistance(totalKmFromPoints(pts))
      }

      function onDblClick(e: any) {
        L.DomEvent.stop(e)
        if (!measureDrawingRef.current) return
        // Remove the last two points added by the two clicks that precede dblclick
        const pts = measurePointsRef.current.slice(0, -2)
        measurePointsRef.current = pts
        setMeasurePoints(pts)
        if (pts.length >= 2) {
          measurePolylineRef.current?.remove()
          measurePolylineRef.current = L.polyline(geodesicPath(pts), {
            color: '#ffffff', weight: 2.5, dashArray: '6 4', pane: 'overlayPane',
          }).addTo(map)
        }
        // Remove last two dot markers
        const removed = measureMarkersRef.current.splice(-2)
        removed.forEach(m => m.remove())
        finalize()
      }

      function onMapClick(e: any) {
        if (!measureDrawingRef.current) return
        const pt: [number, number] = [e.latlng.lat, e.latlng.lng]
        const newPts = [...measurePointsRef.current, pt]
        measurePointsRef.current = newPts
        setMeasurePoints(newPts)

        const dot = L.circleMarker(pt, {
          radius: 5, color: '#ffffff', fillColor: '#ffffff', fillOpacity: 1,
          weight: 2, pane: 'markerPane',
        }).addTo(map)
        measureMarkersRef.current.push(dot)

        if (newPts.length >= 2) {
          measurePolylineRef.current?.remove()
          measurePolylineRef.current = L.polyline(geodesicPath(newPts), {
            color: '#ffffff', weight: 2.5, dashArray: '6 4', pane: 'overlayPane',
          }).addTo(map)
        }
      }

      function onMouseMove(e: any) {
        if (!measureDrawingRef.current) return
        const pts = measurePointsRef.current
        const cur: [number, number] = [e.latlng.lat, e.latlng.lng]
        const preview = pts.length === 0 ? 0 : totalKmFromPoints([...pts, cur])
        setMeasureDistance(preview)
        if (pts.length === 0) return
        measureRubberRef.current?.remove()
        measureRubberRef.current = L.polyline(geodesicArc(pts[pts.length - 1], cur), {
          color: '#ffffff', weight: 1.5, dashArray: '4 4', opacity: 0.5, pane: 'overlayPane',
        }).addTo(map)
      }

      function onKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape') setMeasureActive(false)
      }

      map.on('click', onMapClick)
      map.on('mousemove', onMouseMove)
      map.on('dblclick', onDblClick)
      window.addEventListener('keydown', onKeyDown)

      return () => {
        map.off('click', onMapClick)
        map.off('mousemove', onMouseMove)
        map.off('dblclick', onDblClick)
        window.removeEventListener('keydown', onKeyDown);
        (map.getContainer?.() ?? document.body).style.cursor = ''
      }
    }

    const cleanup = setup()
    if (cleanup) return cleanup
    const t = setTimeout(() => setup(), 100)
    return () => clearTimeout(t)
  }, [measureActive])

  function clearMeasure() {
    setMeasurePoints([])
    setMeasureDistance(0)
    measurePointsRef.current = []
    measurePolylineRef.current?.remove()
    measurePolylineRef.current = null
    measureRubberRef.current?.remove()
    measureRubberRef.current = null
    measureMarkersRef.current.forEach(m => m.remove())
    measureMarkersRef.current = []
  }

  function toggleMeasure() {
    if (measureActive) {
      clearMeasure()
      setMeasureActive(false)
    } else {
      setTrueSizeActive(false)
      setMeasurePoints([])
      setMeasureDistance(0)
      setMeasureActive(true)
    }
  }

  function formatMeasureDistance(km: number) {
    if (km < 1) return `${Math.round(km * 1000)} m`
    return `${km.toFixed(1)} km`
  }

  // True size tool — Switzerland overlay draggable on map
  useEffect(() => {
    const L = (window as any)._L
    if (!L) return

    function setup() {
      const map = mapRef.current as NonNullable<typeof mapRef.current>
      if (!map) return

      if (!trueSizeActive) {
        trueSizeLayerRef.current?.remove()
        trueSizeLayerRef.current = null
        return
      }

      // Center Switzerland on current map view
      const center = map.getCenter()
      trueSizeOffsetRef.current = [
        center.lat - SWITZERLAND_CENTROID[0],
        center.lng - SWITZERLAND_CENTROID[1],
      ]

      function translated() {
        const [dLat, dLng] = trueSizeOffsetRef.current
        return SWITZERLAND_POLY.map(([lat, lng]) => [lat + dLat, lng + dLng] as [number, number])
      }

      const CHARMEY: [number, number] = [46.6189, 7.1647]

      const layer = L.polygon(translated(), {
        color: '#ef4444',
        weight: 2,
        fillColor: '#ef4444',
        fillOpacity: 0.18,
        dashArray: '6 4',
        pane: 'overlayPane',
      }).addTo(map)

      trueSizeLayerRef.current = layer

      function charmeyLatLng(): [number, number] {
        const [dLat, dLng] = trueSizeOffsetRef.current
        return [CHARMEY[0] + dLat, CHARMEY[1] + dLng]
      }

      const charmeyIcon = L.divIcon({
        className: '',
        html: '<div style="display:flex;align-items:center;gap:4px;pointer-events:none"><div style="width:7px;height:7px;border-radius:50%;background:#ef4444;border:1.5px solid #fff;flex-shrink:0"></div><span style="font-size:10px;color:#fff;white-space:nowrap;text-shadow:0 1px 3px rgba(0,0,0,0.9);font-family:sans-serif">📍 Charmey</span></div>',
        iconAnchor: [4, 4],
      })
      const charmeyMarker = L.marker(charmeyLatLng(), { icon: charmeyIcon, pane: 'markerPane', interactive: false }).addTo(map)

      // Drag support
      let dragging = false
      let lastLatLng: any = null

      function onLayerMouseDown(e: any) {
        L.DomEvent.stop(e)
        dragging = true
        lastLatLng = e.latlng
        map.dragging.disable()
        const container = map.getContainer?.()
        if (container) container.style.cursor = 'grabbing'
        map.on('mousemove', onMapMouseMove)
        map.on('mouseup', onMapMouseUp)
      }

      function onMapMouseMove(e: any) {
        if (!dragging || !lastLatLng) return
        const dLat = e.latlng.lat - lastLatLng.lat
        const dLng = e.latlng.lng - lastLatLng.lng
        trueSizeOffsetRef.current = [
          trueSizeOffsetRef.current[0] + dLat,
          trueSizeOffsetRef.current[1] + dLng,
        ]
        lastLatLng = e.latlng
        layer.setLatLngs(translated())
        charmeyMarker.setLatLng(charmeyLatLng())
      }

      function onMapMouseUp() {
        dragging = false
        lastLatLng = null
        map.dragging.enable()
        map.off('mousemove', onMapMouseMove)
        map.off('mouseup', onMapMouseUp)
      }

      layer.on('mousedown', onLayerMouseDown)
      layer.on('mouseover', () => { (map.getContainer?.() ?? document.body).style.cursor = 'grab' })
      layer.on('mouseout', () => { (map.getContainer?.() ?? document.body).style.cursor = '' })

      return () => {
        layer.remove()
        charmeyMarker.remove()
        trueSizeLayerRef.current = null
        map.off('mousemove', onMapMouseMove)
        map.off('mouseup', onMapMouseUp)
        map.dragging.enable();
        (map.getContainer?.() ?? document.body).style.cursor = ''
      }
    }

    const cleanup = setup()
    if (cleanup) return cleanup
    const t = setTimeout(() => setup(), 100)
    return () => clearTimeout(t)
  }, [trueSizeActive])

  // On the trip detail page (externalHover provided), auto-select the single trip
  const effectiveTripIndex = externalHover !== undefined && trips.length === 1
    ? 0
    : selectedTripIndex

  const selectedTrip = effectiveTripIndex !== null ? trips[effectiveTripIndex] : null

  const routePanelData = useMemo(() => {
    if (selectedRouteIndex === null) return null
    const route = plannedRoutes[selectedRouteIndex]
    if (!route) return null
    const mask = computeRiddenMask(route.coordinates, trips)
    const { total } = computeRouteDistances(route.coordinates)
    const ridden = computeRiddenDistM(route.coordinates, mask)
    const totalKm = Math.round(total / 1000)
    const riddenKm = Math.round(ridden / 1000)
    const pct = total > 0 ? Math.round((ridden / total) * 100) : 0
    // Compute riddenUpToM scaled to the elevation profile distances
    let riddenUpToM: number | undefined
    if (routeElevation && routeElevation.length > 0 && total > 0) {
      const fraction = ridden / total
      riddenUpToM = fraction * routeElevation[routeElevation.length - 1][0]
    }
    return { route, totalKm, riddenKm, remainKm: totalKm - riddenKm, pct, riddenUpToM }
  }, [selectedRouteIndex, plannedRoutes, trips, routeElevation])

  // Build cumulative distances whenever selected trip changes
  const cumDists = useMemo(() => {
    if (effectiveTripIndex === null) return null
    const trip = trips[effectiveTripIndex]
    if (!trip || trip.coordinates.length < 2) return null
    return buildCumDists(trip.coordinates)
  }, [effectiveTripIndex, trips])

  // Keep cumDists in a ref for use inside Leaflet closures
  useEffect(() => {
    cumDistsRef.current = cumDists
  }, [cumDists])

  // Effect: show/hide orange circle marker on the map based on hoveredDistance
  // When externalHover is provided (trip detail page), use its distance instead
  useEffect(() => {
    const L = (window as any)._L
    if (!L || !mapRef.current) return

    const effectiveDist = externalHoverRef.current !== undefined
      ? externalHoverRef.current.distance
      : hoveredDistance

    const activeTripIndex = externalHoverRef.current !== undefined && trips.length === 1
      ? 0
      : selectedTripIndex

    if (effectiveDist == null || activeTripIndex === null) {
      if (hoverMarkerRef.current) {
        hoverMarkerRef.current.setStyle({ opacity: 0, fillOpacity: 0 })
      }
      return
    }

    const trip = trips[activeTripIndex]
    if (!trip || !cumDistsRef.current) return

    const latLng = interpolateOnPath(trip.coordinates, cumDistsRef.current, effectiveDist)
    if (!latLng) return

    if (!hoverMarkerRef.current) {
      hoverMarkerRef.current = L.circleMarker(latLng, {
        radius: 6,
        color: '#f97316',
        fillColor: '#f97316',
        fillOpacity: 0.9,
        opacity: 1,
        weight: 2,
      }).addTo(mapRef.current)
    } else {
      hoverMarkerRef.current.setLatLng(latLng)
      hoverMarkerRef.current.setStyle({ opacity: 1, fillOpacity: 0.9 })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredDistance, externalHover?.distance, selectedTripIndex, trips])

  // Effect: show/hide cyan circle marker on planned route based on hoveredRouteDistance
  useEffect(() => {
    const L = (window as any)._L
    if (!L || !mapRef.current) return
    if (hoveredRouteDistance == null || selectedRouteIndex === null) {
      if (hoverRouteMarkerRef.current) {
        hoverRouteMarkerRef.current.setStyle({ opacity: 0, fillOpacity: 0 })
      }
      return
    }
    const route = plannedRoutes[selectedRouteIndex]
    if (!route || !routeCumDistsRef.current) return
    const latLng = interpolateOnPath(route.coordinates, routeCumDistsRef.current, hoveredRouteDistance)
    if (!latLng) return
    if (!hoverRouteMarkerRef.current) {
      hoverRouteMarkerRef.current = L.circleMarker(latLng, {
        radius: 6, color: '#22d3ee', fillColor: '#22d3ee', fillOpacity: 0.9, opacity: 1, weight: 2,
      }).addTo(mapRef.current)
    } else {
      hoverRouteMarkerRef.current.setLatLng(latLng)
      hoverRouteMarkerRef.current.setStyle({ opacity: 1, fillOpacity: 0.9 })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredRouteDistance, selectedRouteIndex])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!showWeather) {
      weatherLayerRef.current?.hide(map)
      return
    }
    if (!weatherLayerRef.current) {
      const wl = new WeatherLayer()
      weatherLayerRef.current = wl
      wl.addTo(map).then(() => wl.load(map).then(() => wl.show(map)))
    } else {
      weatherLayerRef.current.load(map).then(() => weatherLayerRef.current!.show(map))
    }
  }, [showWeather])

  useEffect(() => {
    if (!wikiTarget) { setWikiSummary(null); return }
    setWikiLoading(true)
    setWikiSummary(null)
    const lang = locale === 'en' ? 'en' : 'fr'
    const tryFetch = (l: string) =>
      fetch(`https://${l}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTarget.wiki_slug)}`)
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
    tryFetch(lang)
      .catch(() => lang !== 'en' ? tryFetch('en') : Promise.reject())
      .then((data: WikiSummary) => setWikiSummary(data))
      .catch(() => {})
      .finally(() => setWikiLoading(false))
  }, [wikiTarget, locale])

  useEffect(() => {
    const map = mapRef.current
    const L = (window as any)._L
    if (!map || !L || !tileLayerRef.current) return
    tileLayerRef.current.remove()
    if (basemap === 'topo') {
      tileLayerRef.current = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
        maxZoom: 17,
      }).addTo(map)
    } else {
      tileLayerRef.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map)
    }
  }, [basemap])

  // Restyle map objects when basemap changes
  useEffect(() => {
    if (!mapRef.current) return
    const tripColor = basemap === 'topo' ? '#dc2626' : '#f97316'
    const plannedColor = basemap === 'topo' ? '#1d4ed8' : '#22d3ee'

    // Trip polylines
    polylinesRef.current.forEach((pl) => pl.setStyle({ color: tripColor }))
    const glowLines = (mapRef.current as any)._glowLines as any[]
    if (glowLines) glowLines.forEach((pl: any) => pl.setStyle({ color: tripColor }))

    // Hover marker
    if (hoverMarkerRef.current) hoverMarkerRef.current.setStyle({ color: tripColor, fillColor: tripColor })

    // Planned route lines
    plannedLinesRef.current.forEach(({ segLines, routeColor }) => {
      const color = basemap === 'topo' ? '#1d4ed8' : routeColor
      segLines.forEach(({ line }) => line.setStyle({ color }))
    })

    // Weather icons
    weatherLayerRef.current?.restyle(basemap)
  }, [basemap])

  function endpointIcon(L: any, type: 'start' | 'end', color: string) {
    const size = 28
    const svgIcon = type === 'start'
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`
    return L.divIcon({
      html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;pointer-events:none">${svgIcon}</div>`,
      className: '',
      iconAnchor: [size / 2, size / 2],
    })
  }

  function calloutIcon(L: any, label: string, color: string, lineHeight: number, side: 'left' | 'right' | 'center') {
    // The dot must sit exactly at the geographic coordinate.
    // iconAnchor is always the dot center: [dotCenterX, dotCenterY].
    // The label is shifted left/right via absolute positioning so the dot stays pinned.
    const dotSize = 9
    const labelW = 88
    const iconWidth = labelW + 40  // extra room for side shift without clipping
    const dotCenterX = iconWidth / 2
    const labelHeight = 26  // approx rendered height of label box
    const dotCenterY = labelHeight + lineHeight + dotSize / 2

    const labelShift = side === 'right' ? -20 : side === 'left' ? 20 : 0
    const labelLeft = dotCenterX - labelW / 2 + labelShift

    return L.divIcon({
      html: `<div style="position:relative;width:${iconWidth}px;height:${dotCenterY + dotSize}px;pointer-events:none">
        <div style="position:absolute;left:${labelLeft}px;top:0;width:${labelW}px;background:rgba(10,15,28,0.95);border:2px solid ${color};border-radius:8px;padding:3px 8px;font-size:11px;font-weight:700;color:${color};white-space:nowrap;text-align:center;box-shadow:0 3px 10px rgba(0,0,0,0.6);letter-spacing:0.3px">${label}</div>
        <div style="position:absolute;left:${dotCenterX - 1}px;top:${labelHeight}px;width:2px;height:${lineHeight}px;background:${color};opacity:0.7"></div>
        <div style="position:absolute;left:${dotCenterX - dotSize / 2}px;top:${labelHeight + lineHeight}px;width:${dotSize}px;height:${dotSize}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 0 3px ${color}44"></div>
      </div>`,
      className: '',
      iconAnchor: [dotCenterX, dotCenterY],
    })
  }

  function snapToTrack(coords: [number, number][], lat: number, lng: number): [number, number] {
    let best: [number, number] = [lat, lng]
    let bestDist = Infinity
    const cosLat = Math.cos(lat * Math.PI / 180)
    for (const [cLng, cLat] of coords) {
      const dLat = cLat - lat
      const dLng = (cLng - lng) * cosLat
      const d = dLat * dLat + dLng * dLng
      if (d < bestDist) { bestDist = d; best = [cLat, cLng] }
    }
    return best
  }

  function addTripMarkers(trip: typeof trips[number], L: any, map: LeafletMap) {
    if (!L || !map) return
    const coords = trip.coordinates

    // Returns the index of the nearest coordinate to lat/lng
    function snapIdx(lat: number, lng: number): number {
      let bestIdx = 0, bestDist = Infinity
      const cosLat = Math.cos(lat * Math.PI / 180)
      for (let i = 0; i < coords.length; i++) {
        const [cLng, cLat] = coords[i]
        const d = (cLat - lat) ** 2 + ((cLng - lng) * cosLat) ** 2
        if (d < bestDist) { bestDist = d; bestIdx = i }
      }
      return bestIdx
    }

    // Collect all markers, sorted by track position
    const pending: { lat: number; lng: number; label: string; color: string; lineH: number; side: 'left' | 'right' | 'center'; idx: number }[] = []

    if (trip.max_speed_lat != null && trip.max_speed_lng != null) {
      const spdVal = trip.max_speed_ms != null ? Math.round(trip.max_speed_ms * 3.6) : null
      const speedoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="display:inline-block;vertical-align:middle;margin-right:3px;margin-bottom:1px"><path d="M3.34 17a10 10 0 1 1 17.32 0"/><line x1="12" y1="12" x2="17" y2="7"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>`
      const label = spdVal != null ? `${speedoSvg}${spdVal} km/h` : speedoSvg
      pending.push({ lat: trip.max_speed_lat, lng: trip.max_speed_lng, label, color: '#3b82f6', lineH: 28, side: 'right', idx: snapIdx(trip.max_speed_lat, trip.max_speed_lng) })
    }

    if (trip.elev_high_lat != null && trip.elev_high_lng != null) {
      const label = trip.elev_high != null ? `▲ ${Math.round(trip.elev_high)} m` : '▲'
      pending.push({ lat: trip.elev_high_lat, lng: trip.elev_high_lng, label, color: '#10b981', lineH: 36, side: 'left', idx: snapIdx(trip.elev_high_lat, trip.elev_high_lng) })
    }

    if (trip.breaks) {
      trip.breaks.forEach((b, i) => {
        pending.push({ lat: b.lat, lng: b.lng, label: `⏸ ${b.duration_min} min`, color: '#f59e0b', lineH: 24, side: i % 2 === 0 ? 'right' : 'left', idx: snapIdx(b.lat, b.lng) })
      })
    }

    // Sort by position along track then stagger overlapping markers
    pending.sort((a, b) => a.idx - b.idx)
    const overlapWindow = Math.max(4, Math.floor(coords.length / 60))
    for (let i = 1; i < pending.length; i++) {
      if (pending[i].idx - pending[i - 1].idx < overlapWindow) {
        pending[i].lineH = pending[i - 1].lineH + 20
        // Flip side to reduce label overlap
        pending[i].side = pending[i - 1].side === 'left' ? 'right' : 'left'
      }
    }

    const created: any[] = []
    for (const m of pending) {
      const [sLat, sLng] = snapToTrack(coords, m.lat, m.lng)
      const marker = L.marker([sLat, sLng], { icon: calloutIcon(L, m.label, m.color, m.lineH, m.side) }).addTo(map)
      breakMarkersRef.current.push(marker)
      created.push(marker)
    }

    // Start / end markers
    if (coords.length >= 2) {
      const [startLng, startLat] = coords[0]
      const [endLng, endLat] = coords[coords.length - 1]
      const startM = L.marker([startLat, startLng], { icon: endpointIcon(L, 'start', '#22c55e') }).addTo(map)
      const endM = L.marker([endLat, endLng], { icon: endpointIcon(L, 'end', '#ef4444') }).addTo(map)
      breakMarkersRef.current.push(startM, endM)
      created.push(startM, endM)
    }

    return created
  }

  function setupMarkerSpread(allMarkers: any[], map: LeafletMap) {
    if (allMarkers.length < 2) return
    const PIXEL_THRESHOLD = 48
    const SPREAD_PX = 52

    // Store original state once
    allMarkers.forEach((m) => {
      m._origLatLng = m.getLatLng()
      m._origIcon = m.options.icon
      m._isSpread = false
    })

    let mouseMoveCleanup: (() => void) | null = null

    // Restore all spread markers (called on zoom change or mouse-leave)
    function restoreAll() {
      if (mouseMoveCleanup) { mouseMoveCleanup(); mouseMoveCleanup = null }
      allMarkers.forEach((m) => {
        if (!m._isSpread) return
        m._isSpread = false
        if (m._icon) m._icon.style.transition = 'transform 0.15s ease'
        m.setLatLng(m._origLatLng)
        if (m._origIcon) m.setIcon(m._origIcon)
      })
    }
    map.on('zoomend', restoreAll)

    for (const marker of allMarkers) {
      marker.on('mouseover', () => {
        if (marker._isSpread) return

        // Detect overlap using original positions (stable across multiple spreads)
        const hPt = (map as any).latLngToContainerPoint(marker._origLatLng)
        const group: { marker: any; orig: any }[] = allMarkers
          .filter((m) => {
            const pt = (map as any).latLngToContainerPoint(m._origLatLng)
            return Math.sqrt((pt.x - hPt.x) ** 2 + (pt.y - hPt.y) ** 2) < PIXEL_THRESHOLD
          })
          .map((m) => ({ marker: m, orig: m._origLatLng }))

        if (group.length < 2) return

        group.forEach(({ marker: m }) => { m._isSpread = true })

        const n = group.length
        const cPt = group.reduce(
          (acc, { orig }) => {
            const pt = (map as any).latLngToContainerPoint(orig)
            return { x: acc.x + pt.x / n, y: acc.y + pt.y / n }
          },
          { x: 0, y: 0 }
        )
        const radius = SPREAD_PX * Math.ceil(n / 2)

        group.forEach(({ marker: m }, i) => {
          const angle = (2 * Math.PI * i / n) - Math.PI / 2
          if (m._icon) m._icon.style.transition = 'transform 0.2s ease'
          m.setLatLng((map as any).containerPointToLatLng([
            cPt.x + Math.cos(angle) * radius,
            cPt.y + Math.sin(angle) * radius * 0.65,
          ]))

          // Highlight waypoint (camera) markers when spread — no label, just glow
          if ((m as any)._spreadLabel !== undefined) {
            const L = (window as any)._L
            if (!L) return
            m.setIcon(L.divIcon({
              html: `<div style="width:32px;height:32px;background:#1e293b;border:2px solid #f97316;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 0 0 6px rgba(249,115,22,0.25);cursor:pointer">📷</div>`,
              className: '',
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            }))
          }
        })

        // Restore when cursor leaves the spread circle
        if (mouseMoveCleanup) mouseMoveCleanup()
        const leaveRadius = radius + 44
        function onMouseMove(e: any) {
          const mPt = (map as any).latLngToContainerPoint(e.latlng)
          if (Math.sqrt((mPt.x - cPt.x) ** 2 + (mPt.y - cPt.y) ** 2) > leaveRadius) {
            restoreAll()
          }
        }
        map.on('mousemove', onMouseMove)
        mouseMoveCleanup = () => map.off('mousemove', onMouseMove)
      })
    }
  }

  function selectTrip(index: number) {
    setSelectedTripIndex(index)
    selectedTripIndexRef.current = index
    setActiveVideoId(null)
    setHoveredDistance(null)
    setJournalExpanded(false)
    setJournalLong(false)

    // Fly to the trip bounds
    const L = (window as any)._L
    if (!L || !mapRef.current) return
    const trip = trips[index]
    if (trip.coordinates.length < 2) return
    const latLngs = trip.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number])
    // On mobile the bottom sheet covers 65vh — add bottom padding so the route
    // centres in the visible area above the sheet
    const mobile = window.innerWidth < 768
    const bottomPad = mobile ? Math.round(window.innerHeight * 0.5) : 60
    const rightPad = mobile ? 60 : 416 + 32
    mapRef.current.fitBounds(L.latLngBounds(latLngs), { paddingTopLeft: [60, 60], paddingBottomRight: [rightPad, bottomPad], maxZoom: 12 })

    // Remove previous break markers
    const Lmap = (window as any)._L
    breakMarkersRef.current.forEach(m => m.remove())
    breakMarkersRef.current = []

    const calloutMarkers = addTripMarkers(trips[index], Lmap, mapRef.current!) ?? []
    setupMarkerSpread([...waypointMarkersRef.current, ...calloutMarkers], mapRef.current!)

    // Highlight selected, dim others
    polylinesRef.current.forEach((pl, i) => {
      pl.setStyle({
        opacity: i === index ? 1 : 0.25,
        weight: i === index ? 5 : 3,
      })
    })
    // Also dim the glow lines
    const glowLines = (mapRef.current as any)._glowLines as Polyline[]
    if (glowLines) {
      glowLines.forEach((pl, i) => {
        pl.setStyle({ opacity: i === index ? 0.2 : 0.04 })
      })
    }
  }

  function closePanel() {
    setSelectedTripIndex(null)
    setHoveredDistance(null)
    setActiveVideoId(null)
    setMapVideoModal(null)
    selectedTripIndexRef.current = null
    breakMarkersRef.current.forEach(m => m.remove())
    breakMarkersRef.current = []
    // Hide marker
    if (hoverMarkerRef.current) hoverMarkerRef.current.setStyle({ opacity: 0, fillOpacity: 0 })
    // Restore all polylines
    polylinesRef.current.forEach((pl) => pl.setStyle({ opacity: 0.95, weight: 4 }))
    const glowLines = (mapRef.current as any)?._glowLines as Polyline[]
    if (glowLines) glowLines.forEach((pl) => pl.setStyle({ opacity: 0.15 }))
    // Fit all
    const L = (window as any)._L
    if (!L || !mapRef.current) return
    const allLatLngs = trips.flatMap((t) =>
      t.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number])
    )
    if (allLatLngs.length > 0) {
      mapRef.current.fitBounds(L.latLngBounds(allLatLngs), { padding: [40, 40] })
    }
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false

    async function initMap() {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
      if (cancelled || !containerRef.current) return

      ;(window as any)._L = L

      const map = L.map(containerRef.current, {
        zoomControl: false,
        minZoom: 3,
        preferCanvas: true,
      }).setView([46.2276, 2.2137], 6)

      tileLayerRef.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map)

      mapRef.current = map

      // Polar circles at 66.5634° N/S — span 3 world copies so they're visible when panning
      const POLAR_LAT = 66.5634
      const polarOpts = { color: '#94a3b8', weight: 1, opacity: 0.7, dashArray: '6, 8', interactive: false }
      const lngs = Array.from({ length: 217 }, (_, i) => -540 + i * 5)
      L.polyline(lngs.map(lng => [POLAR_LAT, lng]), polarOpts).addTo(map)
      L.polyline(lngs.map(lng => [-POLAR_LAT, lng]), polarOpts).addTo(map)

      const glowLines: Polyline[] = []
      const tripHitZones: any[] = []

      trips.forEach((trip, index) => {
        if (trip.coordinates.length < 2) return
        const latLngs = trip.coordinates.map(([lng, lat]) => [lat, lng] as [number, number])

        const glow = L.polyline(latLngs, { color: '#f97316', weight: 14, opacity: 0.15, smoothFactor: 0, interactive: false }).addTo(map)
        glowLines.push(glow)

        const line = L.polyline(latLngs, { color: '#f97316', weight: 4, opacity: 0.95, smoothFactor: 0, interactive: false }).addTo(map)
        polylinesRef.current.push(line)

        // Invisible wide hit zone — captures hover/click without affecting visual width
        const hitZone = L.polyline(latLngs, { color: '#f97316', weight: 20, opacity: 0, smoothFactor: 0 }).addTo(map)

        hitZone.on('click', (e: any) => { L.DomEvent.stopPropagation(e); selectTrip(index) })
        tripHitZones.push(hitZone)

        hitZone.on('mouseover', () => {
          if (selectedTripIndexRef.current === null) line.setStyle({ weight: 6, opacity: 1 })
        })
        hitZone.on('mouseout', () => {
          if (selectedTripIndexRef.current === null) line.setStyle({ weight: 4, opacity: 0.95 })
          if (selectedTripIndexRef.current === index || externalHoverRef.current !== undefined) {
            setHoveredDistanceRef.current(null)
            externalHoverRef.current?.onDistance(null)
          }
        })

        // Map → Profile: track mouse position along polyline
        hitZone.on('mousemove', (e: any) => {
          const isExternalMode = externalHoverRef.current !== undefined
          if (!isExternalMode && selectedTripIndexRef.current !== index) return
          if (isExternalMode && index !== 0) return
          const cd = cumDistsRef.current
          if (!cd) return
          const { lat, lng } = e.latlng
          const dist = closestDistOnPath(lat, lng, trip.coordinates, cd)
          setHoveredDistanceRef.current(dist)
          externalHoverRef.current?.onDistance(dist)
        })
      })

      ;(map as any)._glowLines = glowLines

      // Planned routes — ridden segments orange solid, unridden dashed route color
      for (let routeIdx = 0; routeIdx < (plannedRoutes ?? []).length; routeIdx++) {
        const route = plannedRoutes[routeIdx]
        if (route.coordinates.length < 2) continue

        const mask = computeRiddenMask(route.coordinates, trips)
        const segments = splitRiddenSegments(route.coordinates, mask)
        const segLines: { line: any; ridden: boolean }[] = []

        for (const seg of segments) {
          if (seg.ridden) continue
          const latLngs = seg.coords.map(([lng, lat]) => [lat, lng] as [number, number])
          const line = L.polyline(latLngs, { color: route.color, weight: 2, opacity: 0.7, dashArray: '8, 10', interactive: false }).addTo(map)
          segLines.push({ line, ridden: false })
        }

        plannedLinesRef.current.push({ segLines, routeColor: route.color })

        // Invisible hit zone for click
        const hitLatLngs = route.coordinates.map(([lng, lat]) => [lat, lng] as [number, number])
        const hitZone = L.polyline(hitLatLngs, { color: route.color, weight: 16, opacity: 0 }).addTo(map)
        hitZone.on('click', (e: any) => {
          L.DomEvent.stopPropagation(e)
          setSelectedRouteIndex(routeIdx)
          selectedRouteIndexRef.current = routeIdx
          routeCumDistsRef.current = buildCumDists(route.coordinates)
          // Use DB-stored elevation if available
          if (route.elevation) {
            routeElevationCache.current[route.id] = route.elevation
            setRouteElevation(route.elevation)
            return
          }
          const cached = routeElevationCache.current[route.id]
          if (cached) {
            setRouteElevation(cached)
            return
          }
          setRouteElevation(null)
          setRouteElevationLoading(true)
          fetch('/api/elevation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ coordinates: route.coordinates, routeId: route.id }),
          })
            .then((r) => r.json())
            .then((data) => {
              if (data.elevation) {
                routeElevationCache.current[route.id] = data.elevation
                setRouteElevation(data.elevation)
              }
            })
            .catch(() => {})
            .finally(() => setRouteElevationLoading(false))
        })

        hitZone.on('mousemove', (e: any) => {
          if (selectedRouteIndexRef.current !== routeIdx) return
          const cd = routeCumDistsRef.current
          if (!cd) return
          const dist = closestDistOnPath(e.latlng.lat, e.latlng.lng, route.coordinates, cd)
          setHoveredRouteDistanceRef.current(dist)
        })
        hitZone.on('mouseout', () => {
          if (selectedRouteIndexRef.current !== routeIdx) return
          setHoveredRouteDistanceRef.current(null)
        })
      }

      // Ensure trip hit zones are above planned route hit zones
      tripHitZones.forEach(hz => hz.bringToFront())

      // Close planned route panel on map click (skip when measure mode is active)
      map.on('click', () => {
        if (measureActiveRef.current) return
        if (selectedRouteIndexRef.current !== null) {
          setSelectedRouteIndex(null)
          setRouteElevation(null)
          setHoveredRouteDistance(null)
          selectedRouteIndexRef.current = null
          routeCumDistsRef.current = null
        }
      })

      // Camera markers
      const cameraIcon = L.divIcon({
        html: `<div style="
          width:32px;height:32px;background:#1e293b;
          border:2px solid #f97316;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font-size:14px;box-shadow:0 0 0 4px rgba(249,115,22,0.15);
          cursor:pointer;">📷</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })

      // Zoom threshold defined at module level (PHOTO_ZOOM_THRESHOLD)
      const waypointMarkers: any[] = []
      waypointMarkersRef.current = waypointMarkers

      for (const wp of waypoints) {
        const marker = L.marker([wp.lat, wp.lng], { icon: cameraIcon })
        ;(marker as any)._spreadLabel = wp.title ?? ''
        marker.on('click', () => setSelectedPhotoIndex(waypoints.indexOf(wp)))
        waypointMarkers.push(marker)
      }
      setupMarkerSpread(waypointMarkers, map)

      function updateMarkerVisibility() {
        const zoom = map.getZoom()
        if (zoom >= PHOTO_ZOOM_THRESHOLD) {
          waypointMarkers.forEach((m) => { if (!map.hasLayer(m)) m.addTo(map) })
        } else {
          waypointMarkers.forEach((m) => { if (map.hasLayer(m)) m.remove() })
        }
      }

      map.on('zoomend', () => { updateMarkerVisibility(); setMapZoom(map.getZoom()) })
      updateMarkerVisibility()

      // 🥚 Easter egg: Teysachaux — only visible at zoom ≥ 14
      const EGG_ZOOM = 14
      const eggIcon = L.divIcon({
        html: `<div style="font-size:11px;opacity:0.35;cursor:pointer;user-select:none;line-height:1">🏔️</div>`,
        className: '',
        iconAnchor: [6, 11],
      })
      const eggMarker = L.marker([46.534056, 6.996306], { icon: eggIcon, zIndexOffset: -500, opacity: 0 })
      eggMarker.on('click', () => window.open('https://www.instagram.com/molechaux_sports_team/', '_blank', 'noopener'))
      eggMarker.bindTooltip(
        '🏔️ <b>Teysachaux</b><br>La plus belle montagne du monde 🥇<br><i>(juste avant Moléson 🤫)</i>',
        { direction: 'top', offset: [0, -14], className: 'egg-tooltip' }
      )
      function updateEggVisibility() {
        if (map.getZoom() >= EGG_ZOOM) {
          if (!map.hasLayer(eggMarker)) eggMarker.addTo(map)
        } else {
          if (map.hasLayer(eggMarker)) eggMarker.remove()
        }
      }
      map.on('zoomend', updateEggVisibility)
      updateEggVisibility()

      // City markers (visible from zoom 9)
      const CITY_ZOOM = 9
      const cityIconHtml = `<div style="
          width:20px;height:20px;border-radius:50%;
          background:rgba(15,23,42,0.88);
          border:1.5px solid rgba(148,163,184,0.6);
          display:flex;align-items:center;justify-content:center;
          font-size:12px;font-weight:700;color:#94a3b8;line-height:1;
          box-shadow:0 2px 6px rgba(0,0,0,0.5);
          cursor:pointer;
        ">?</div>`

      function cityAnchor(zoom: number): [number, number] {
        const shift = Math.round(Math.max(0, 12 - zoom) * 2 + 4)
        return [10 - shift, 10 + shift + 2]
      }

      function makeCityIcon(zoom: number) {
        const anchor = cityAnchor(zoom)
        return L.divIcon({ html: cityIconHtml, className: '', iconSize: [20, 20], iconAnchor: anchor })
      }

      const cityMarkers: any[] = []
      for (const city of routeCities) {
        const m = L.marker([city.lat, city.lng], { icon: makeCityIcon(map.getZoom()), zIndexOffset: 500 })
        m.on('click', () => setWikiTarget(city))
        m.bindTooltip(
          `<div style="background:rgba(15,23,42,0.92);border:1px solid rgba(51,65,85,0.8);border-radius:6px;padding:3px 8px;font-size:11px;font-weight:600;color:#f1f5f9;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.5);font-family:system-ui,sans-serif">${city.name}</div>`,
          { direction: 'top', offset: [0, -12], opacity: 1, className: 'weather-tooltip' }
        )
        cityMarkers.push(m)
      }

      function updateCityVisibility() {
        const z = map.getZoom()
        const icon = makeCityIcon(z)
        cityMarkers.forEach(m => {
          if (z >= CITY_ZOOM) {
            m.setIcon(icon)
            if (!map.hasLayer(m)) m.addTo(map)
          } else {
            if (map.hasLayer(m)) m.remove()
          }
        })
      }
      map.on('zoomend', updateCityVisibility)
      updateCityVisibility()

      // POI markers: mountains, passes, lakes (visible from zoom 7)
      const POI_ZOOM = 7
      const poiInner: Record<string, { svg: string; color: string; border: string }> = {
        mountain: {
          svg: `<svg width="12" height="10" viewBox="0 0 12 10"><polygon points="6,0 12,10 0,10" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
          color: '#94a3b8', border: 'rgba(148,163,184,0.6)',
        },
        pass: {
          svg: `<svg width="14" height="10" viewBox="0 0 14 10"><polyline points="0,9 4,2 7,6 10,2 14,9" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
          color: '#f59e0b', border: 'rgba(245,158,11,0.6)',
        },
        lake: {
          svg: `<svg width="12" height="8" viewBox="0 0 12 8"><path d="M0,4 Q3,0 6,4 Q9,8 12,4" fill="none" stroke="#38bdf8" stroke-width="1.5"/></svg>`,
          color: '#38bdf8', border: 'rgba(56,189,248,0.6)',
        },
      }
      const poiMarkers: any[] = []

      function poiAnchor(zoom: number): [number, number] {
        const shift = Math.round(Math.max(0, 12 - zoom) * 2 + 4)
        return [10 - shift, 10 + shift + 2]
      }

      function makePoiIcon(type: string, zoom: number) {
        const s = poiInner[type] ?? poiInner.mountain
        const anchor = poiAnchor(zoom)
        return L.divIcon({
          html: `<div style="
            width:22px;height:22px;border-radius:50%;
            background:rgba(15,23,42,0.88);
            border:1.5px solid ${s.border};
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 2px 6px rgba(0,0,0,0.5);cursor:pointer;
          ">${s.svg}</div>`,
          className: '',
          iconSize: [22, 22],
          iconAnchor: anchor,
        })
      }

      for (const poi of routePois) {
        const m = L.marker([poi.lat, poi.lng], { icon: makePoiIcon(poi.type, map.getZoom()), zIndexOffset: 400 })
        m.on('click', () => setWikiTarget(poi))
        m.bindTooltip(
          `<div style="background:rgba(15,23,42,0.92);border:1px solid rgba(51,65,85,0.8);border-radius:6px;padding:3px 8px;font-size:11px;font-weight:600;color:#f1f5f9;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.5);font-family:system-ui,sans-serif">${poi.name}</div>`,
          { direction: 'top', offset: [0, -12], opacity: 1, className: 'weather-tooltip' }
        )
        poiMarkers.push(m)
      }

      function updatePoiVisibility() {
        const z = map.getZoom()
        const icon = (type: string) => makePoiIcon(type, z)
        poiMarkers.forEach((m, i) => {
          if (z >= POI_ZOOM) {
            m.setIcon(icon(routePois[i].type))
            if (!map.hasLayer(m)) m.addTo(map)
          } else {
            if (map.hasLayer(m)) m.remove()
          }
        })
      }
      map.on('zoomend', updatePoiVisibility)
      updatePoiVisibility()

      // Live position marker
      if (vincentLat !== null && vincentLat !== undefined && vincentLng !== null && vincentLng !== undefined) {
        const dateLabel = vincentLastDate
          ? new Date(vincentLastDate).toLocaleDateString(locale === 'en' ? 'en-GB' : 'fr-CH', { day: 'numeric', month: 'long', year: 'numeric' })
          : ''
        const vincentIcon = L.divIcon({
          html: `
            <style>
              @keyframes vp-ping{0%{transform:scale(1);opacity:.7}100%{transform:scale(3.5);opacity:0}}
              @keyframes vp-ping2{0%{transform:scale(1);opacity:.5}100%{transform:scale(3.5);opacity:0}}
              @keyframes vp-core{0%,100%{box-shadow:0 0 0 2px rgba(34,211,238,.5),0 0 8px rgba(34,211,238,.6)}50%{box-shadow:0 0 0 2px rgba(34,211,238,.8),0 0 14px rgba(34,211,238,.9)}}
            </style>
            <div style="position:relative;width:12px;height:12px;">
              <div style="position:absolute;inset:0;border-radius:50%;background:#22d3ee;animation:vp-ping 2s ease-out infinite;"></div>
              <div style="position:absolute;inset:0;border-radius:50%;background:#22d3ee;animation:vp-ping2 2s ease-out .8s infinite;"></div>
              <div style="position:absolute;inset:2px;border-radius:50%;background:#22d3ee;border:1px solid #fff;animation:vp-core 2.5s ease-in-out infinite;"></div>
            </div>`,
          className: '',
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        })
        const vincentMarker = L.marker([vincentLat, vincentLng], { icon: vincentIcon, zIndexOffset: 1000, interactive: true })
        vincentMarker.bindTooltip(
          `<div style="font-family:system-ui,sans-serif;text-align:center;">
            <div style="font-weight:700;color:#22d3ee;font-size:12px;">${vincentMarkerLabel}</div>
            ${dateLabel ? `<div style="font-size:10px;color:#94a3b8;margin-top:2px;">${vincentLastSeenLabel}<br>${dateLabel}</div>` : ''}
          </div>`,
          { direction: 'top', offset: [0, -10], opacity: 1, className: 'weather-tooltip' }
        )
        vincentMarker.addTo(map)
      }

      if (vincentLat !== null && vincentLat !== undefined && vincentLng !== null && vincentLng !== undefined) {
        map.setView([vincentLat, vincentLng], 3)
      } else {
        const allLatLngs = trips.flatMap((t) =>
          t.coordinates.map(([lng, lat]) => [lat, lng] as [number, number])
        )
        if (allLatLngs.length > 0) {
          map.fitBounds(L.latLngBounds(allLatLngs), { padding: [40, 40] })
        }
      }

      // On trip detail page, auto-show markers for the single trip
      if (externalHover !== undefined && trips.length === 1) {
        const calloutMarkers = addTripMarkers(trips[0], L, map) ?? []
        setupMarkerSpread([...waypointMarkers, ...calloutMarkers], map)
      }
    }

    initMap()
    return () => {
      cancelled = true
      weatherLayerRef.current?.remove()
      weatherLayerRef.current = null
      breakMarkersRef.current.forEach(m => m.remove())
      breakMarkersRef.current = []
      mapRef.current?.remove()
      mapRef.current = null
      polylinesRef.current = []
    }
  }, [])

  const prevIndex = selectedTripIndex !== null && selectedTripIndex > 0 ? selectedTripIndex - 1 : null
  const nextIndex = selectedTripIndex !== null && selectedTripIndex < trips.length - 1 ? selectedTripIndex + 1 : null

  useEffect(() => {
    const el = journalRef.current
    if (!el) return
    setJournalLong(el.scrollHeight > el.clientHeight + 1)
  }, [selectedTripIndex])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* Trip detail panel — hidden on trip detail page (externalHover mode) */}
      {externalHover === undefined && <div
        className={isMobile
          ? 'absolute left-0 right-0 bottom-0 z-[1000] flex flex-col rounded-t-2xl overflow-hidden transition-all duration-300'
          : 'absolute top-4 right-4 bottom-4 z-[1000] w-[416px] flex flex-col rounded-2xl overflow-hidden transition-all duration-300'
        }
        style={{
          background: 'rgba(15,23,42,0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(51,65,85,0.8)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          ...(isMobile
            ? {
                maxHeight: '65vh',
                transform: selectedTrip ? 'translateY(0)' : 'translateY(100%)',
              }
            : {
                transform: selectedTrip ? 'translateX(0)' : 'translateX(calc(100% + 24px))',
              }
          ),
          pointerEvents: selectedTrip ? 'all' : 'none',
        }}
      >
        {selectedTrip && selectedTripIndex !== null && (
          <>
            {/* Mobile drag handle */}
            {isMobile && (
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-slate-600" />
              </div>
            )}

            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-slate-700/50">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
                  {t('rideCount', { index: selectedTripIndex + 1, total: trips.length })}
                </div>
                <button
                  onClick={closePanel}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors flex-shrink-0"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <h2 className="text-lg font-bold text-white leading-tight mb-1">{selectedTrip.name}</h2>
              <p className="text-sm text-slate-400">
                {new Date(selectedTrip.start_date).toLocaleDateString(locale, {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-px bg-slate-700/30 border-b border-slate-700/50">
              <div className="px-3 py-3 bg-slate-900/50 min-w-0">
                <div className="text-base font-bold text-white truncate">{(selectedTrip.distance_m / 1000).toFixed(1)}</div>
                <div className="text-xs text-slate-500 mt-0.5">{t('km')}</div>
              </div>
              <div className="px-3 py-3 bg-slate-900/50 min-w-0">
                <div className="text-base font-bold text-white truncate">
                  {selectedTrip.elevation ? `↑ ${computeElevationGain(selectedTrip.elevation).toLocaleString()}` : '—'}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{t('mGain')}</div>
              </div>
              <div className="px-3 py-3 bg-slate-900/50 min-w-0">
                <div className="text-base font-bold text-white truncate">{selectedTrip.country ?? '—'}</div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">{t('country') || 'pays'}</div>
              </div>
            </div>

            {/* Stats row 2: max speed, max altitude, breaks */}
            <div className="grid grid-cols-3 gap-px bg-slate-700/30 border-b border-slate-700/50">
              <div className="px-3 py-3 bg-slate-900/50 min-w-0">
                <div className="text-base font-bold text-white truncate">
                  {selectedTrip.max_speed_ms != null ? `${Math.round(selectedTrip.max_speed_ms * 3.6)}` : '—'}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">km/h max</div>
              </div>
              <div className="px-3 py-3 bg-slate-900/50 min-w-0">
                <div className="text-base font-bold text-white truncate">
                  {selectedTrip.elev_high != null ? `${Math.round(selectedTrip.elev_high)}` : '—'}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">m alt. max</div>
              </div>
              <div className="px-3 py-3 bg-slate-900/50 min-w-0">
                <div className="text-base font-bold text-white truncate">
                  {selectedTrip.breaks != null ? selectedTrip.breaks.length : '—'}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">pauses</div>
              </div>
            </div>

            {/* Elevation profile — desktop only (too cramped in mobile bottom sheet) */}
            {!isMobile && selectedTrip.elevation && selectedTrip.elevation.length > 1 && (
              <div className="px-5 py-3 border-b border-slate-700/30">
                <ElevationProfile
                  points={selectedTrip.elevation}
                  hoveredDistance={hoveredDistance}
                  onHoverDistance={setHoveredDistance}
                  gainLabel={t('mGain')}
                />
              </div>
            )}

            {/* Journal + Videos */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {(locale === 'fr' ? selectedTrip.journal_fr : selectedTrip.journal_en) ? (
                <div>
                  <p ref={journalRef} className={`text-sm text-slate-300 leading-relaxed${journalExpanded ? '' : ' line-clamp-3'}`}>
                    {locale === 'fr' ? selectedTrip.journal_fr : selectedTrip.journal_en}
                  </p>
                  {journalLong && (
                    <button
                      onClick={() => setJournalExpanded(e => !e)}
                      className="mt-1 text-xs text-orange-400 hover:text-orange-300 transition-colors"
                    >
                      {journalExpanded ? t('showLess') : t('showMore')}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-600 italic">{t('noJournal')}</p>
              )}

              {/* Videos of the day */}
              {(selectedTrip.youtube_ids ?? []).length > 0 && (
                <div className="pt-2 border-t border-slate-700/50 space-y-2">
                  <div className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                    {t('videosTitle')}
                  </div>
                  {(selectedTrip.youtube_ids ?? []).map((youtubeId) => (
                    <button
                      key={youtubeId}
                      className="relative w-full group rounded-xl overflow-hidden border border-slate-700"
                      onClick={() => setMapVideoModal(youtubeId)}
                    >
                      <img
                        src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                        alt={t('videosTitle')}
                        className="w-full aspect-video object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer: navigation + link */}
            <div className="px-5 py-4 border-t border-slate-700/50 space-y-3">
              <a
                href={`/trips/${selectedTrip.id}`}
                className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                {t('viewTrip')}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>

              {/* Prev / Next */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => prevIndex !== null && selectTrip(prevIndex)}
                  disabled={prevIndex === null}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  {t('previous')}
                </button>
                <button
                  onClick={() => nextIndex !== null && selectTrip(nextIndex)}
                  disabled={nextIndex === null}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  {t('next')}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>}

      {/* Top-left map controls */}
      {externalHover === undefined && !aboutOpen && !(isMobile && selectedRouteIndex !== null) && (
        <div className="absolute top-4 left-4 z-[9999] flex items-center gap-2">
          <button
            onClick={() => setBasemap((v) => v === 'dark' ? 'topo' : 'dark')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: basemap === 'topo' ? 'rgba(251,191,36,0.2)' : 'rgba(15,23,42,0.85)',
              border: basemap === 'topo' ? '1px solid rgba(251,191,36,0.6)' : '1px solid rgba(51,65,85,0.8)',
              backdropFilter: 'blur(8px)',
              color: basemap === 'topo' ? '#fbbf24' : '#94a3b8',
            }}
          >
            <span style={{ fontSize: 16 }}>🗻</span>
            <span className="hidden md:inline">Topo</span>
          </button>
          {mapZoom >= WEATHER_ZOOM_THRESHOLD && (
            <button
              onClick={() => setShowWeather((v) => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: showWeather ? 'rgba(34,211,238,0.2)' : 'rgba(15,23,42,0.85)',
                border: showWeather ? '1px solid rgba(34,211,238,0.6)' : '1px solid rgba(51,65,85,0.8)',
                backdropFilter: 'blur(8px)',
                color: showWeather ? '#22d3ee' : '#94a3b8',
              }}
            >
              <span style={{ fontSize: 16 }}>⛅</span>
              <span className="hidden md:inline">Météo</span>
            </button>
          )}

          {/* Geo tools — desktop only */}
          <div className="hidden md:block relative">
            {measureActive ? (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.4)', backdropFilter: 'blur(8px)', color: '#ffffff', minWidth: 160 }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M2 12h20M2 12l4-4M2 12l4 4M22 12l-4-4M22 12l-4 4"/>
                </svg>
                <span className="flex-1">{measureDistance > 0 ? formatMeasureDistance(measureDistance) : 'Cliquez pour débuter'}</span>
                <button onClick={toggleMeasure} className="text-white/50 hover:text-white transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setGeoToolsOpen(v => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: (geoToolsOpen || trueSizeActive) ? 'rgba(249,115,22,0.15)' : 'rgba(15,23,42,0.85)',
                  border: (geoToolsOpen || trueSizeActive) ? '1px solid rgba(249,115,22,0.5)' : '1px solid rgba(51,65,85,0.8)',
                  backdropFilter: 'blur(8px)',
                  color: (geoToolsOpen || trueSizeActive) ? '#f97316' : '#94a3b8',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                </svg>
                <span>Outils</span>
              </button>
            )}

            {geoToolsOpen && !measureActive && (
              <div
                className="absolute top-full left-0 mt-2 rounded-xl overflow-hidden z-[9999] min-w-[200px]"
                style={{ background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(51,65,85,0.8)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
              >
                <button
                  onClick={() => { toggleMeasure(); setGeoToolsOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left transition-colors"
                  style={{ color: '#cbd5e1', borderBottom: '1px solid rgba(51,65,85,0.5)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(51,65,85,0.4)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12h20M2 12l4-4M2 12l4 4M22 12l-4-4M22 12l-4 4"/>
                  </svg>
                  Mesurer une distance
                </button>
                <button
                  onClick={() => { if (!trueSizeActive) { clearMeasure(); setMeasureActive(false) } setTrueSizeActive(v => !v); setGeoToolsOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left transition-colors"
                  style={{ color: trueSizeActive ? '#f97316' : '#cbd5e1' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(51,65,85,0.4)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
                  </svg>
                  {trueSizeActive ? 'Masquer la Suisse' : 'Vraie taille (CH)'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Wikipedia panel — cities, mountains, passes, lakes */}
      {wikiTarget && (
        <div
          className="absolute bottom-0 left-0 right-0 md:bottom-4 md:left-auto md:right-4 md:w-[420px] z-[1100] md:rounded-2xl overflow-hidden md:max-h-[80vh] md:overflow-y-auto"
          style={{ background: 'rgba(15,23,42,0.97)', backdropFilter: 'blur(12px)', border: '1px solid rgba(51,65,85,0.8)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
        >
          <div className="flex items-start justify-between px-5 pt-5 pb-2">
            <div>
              <div className="text-lg font-bold text-slate-100">{wikiTarget.name}</div>
              <div className="text-xs text-slate-400 mt-0.5">{wikiTarget.country}</div>
            </div>
            <button
              onClick={() => setWikiTarget(null)}
              className="text-slate-500 hover:text-slate-300 transition-colors ml-3 mt-0.5 flex-shrink-0"
              style={{ fontSize: 22, lineHeight: 1 }}
            >×</button>
          </div>
          <div className="px-5 pb-5">
            {wikiLoading && <div className="text-xs text-slate-500 py-2">Chargement…</div>}
            {!wikiLoading && wikiSummary && (
              <>
                {wikiSummary.thumbnail && (
                  <img
                    src={wikiSummary.thumbnail.source}
                    alt={wikiTarget.name}
                    className="w-full h-48 md:h-56 object-cover rounded-xl mb-3"
                  />
                )}
                <p className="text-sm text-slate-300 leading-relaxed line-clamp-[8] md:line-clamp-none">
                  {wikiSummary.extract}
                </p>
                {wikiSummary.content_urls?.desktop?.page && (
                  <a
                    href={wikiSummary.content_urls.desktop.page}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Wikipedia →
                  </a>
                )}
              </>
            )}
            {!wikiLoading && !wikiSummary && (
              <div className="text-xs text-slate-500 py-2">Aucune information disponible.</div>
            )}
          </div>
        </div>
      )}

      {selectedPhotoIndex !== null && (
        <PhotoModal
          photos={waypoints.map((wp) => ({ imageUrl: wp.url_large, title: wp.title ?? '' }))}
          initialIndex={selectedPhotoIndex}
          onClose={() => setSelectedPhotoIndex(null)}
        />
      )}

      {/* Planned route panel */}
      {routePanelData && (
        <div
          className="absolute top-4 left-4 right-4 md:left-[222px] z-[1000] rounded-2xl overflow-hidden"
          style={{ background: 'rgba(15,23,42,0.97)', backdropFilter: 'blur(12px)', border: '1px solid rgba(51,65,85,0.8)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-slate-700/50">
            <div>
              <div className="text-sm font-bold text-white">{routePanelData.route.name}</div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <span style={{ display: 'inline-block', width: 10, height: 3, background: '#f97316', borderRadius: 1 }} />
                  {routePanelData.riddenKm.toLocaleString()} km parcourus
                </span>
                <span className="flex items-center gap-1">
                  <span style={{ display: 'inline-block', width: 10, height: 0, borderTop: '2px dashed #22d3ee' }} />
                  {routePanelData.remainKm.toLocaleString()} km restants
                </span>
                <span className="text-cyan-400 font-semibold">{routePanelData.pct}%</span>
              </div>
            </div>
            <button
              onClick={() => { setSelectedRouteIndex(null); setRouteElevation(null); setHoveredRouteDistance(null); selectedRouteIndexRef.current = null; routeCumDistsRef.current = null }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors flex-shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          {/* Elevation profile */}
          <div className="px-4 py-3">
            {routeElevationLoading ? (
              <div className="text-xs text-slate-500 text-center py-4">Chargement du profil d&apos;altitude…</div>
            ) : routeElevation ? (
              <ElevationProfile
                points={routeElevation}
                riddenUpToM={routePanelData.riddenUpToM}
                hoveredDistance={hoveredRouteDistance}
                onHoverDistance={setHoveredRouteDistance}
                gainLabel="m dénivelé+"
                showStats={false}
                countries={routePanelData.route.countries ?? undefined}
              />
            ) : (
              <div className="text-xs text-slate-500 text-center py-3">Profil d&apos;altitude non disponible</div>
            )}
          </div>
        </div>
      )}

      {/* Stats overlay — hidden on mobile when a trip panel is open */}
      {stats && !(isMobile && selectedTripIndex !== null) && (
        isMobile ? (
          /* Mobile: compact 2-row grid */
          <div
            className="absolute bottom-4 left-2 right-2 z-[1000] rounded-xl px-3 py-2"
            style={{ background: 'rgba(15,23,42,0.90)', backdropFilter: 'blur(8px)', border: '1px solid rgba(51,65,85,0.8)' }}
          >
            <div className="grid grid-cols-4 gap-x-2 gap-y-1 text-center">
              <div>
                <div className="text-[9px] text-slate-500 uppercase leading-tight">{stats.labels.rides}</div>
                <div className="text-sm font-bold text-white leading-tight">{stats.rides}</div>
              </div>
              <div>
                <div className="text-[9px] text-slate-500 uppercase leading-tight">{stats.labels.km}</div>
                <div className="text-sm font-bold text-white leading-tight">{stats.totalKm.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[9px] text-slate-500 uppercase leading-tight">↑ m</div>
                <div className="text-sm font-bold text-white leading-tight">{stats.totalElevationGain.toLocaleString()}</div>
              </div>
              {stats.countries > 0 && (
                <div>
                  <div className="text-[9px] text-slate-500 uppercase leading-tight">{stats.labels.countries}</div>
                  <div className="text-sm font-bold text-white leading-tight">{stats.countries}</div>
                </div>
              )}
            </div>
            {stats.progress && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${stats.progress.pct}%`, background: '#22d3ee' }} />
                </div>
                <div className="text-xs font-bold text-cyan-400 whitespace-nowrap">{stats.progress.pct}% — {stats.progress.kmLeft.toLocaleString()} {stats.labels.km}</div>
              </div>
            )}
          </div>
        ) : (
          /* Desktop: horizontal scrollable row */
          <div
            className="absolute bottom-8 left-4 z-[1000] rounded-xl px-5 py-3 flex items-center gap-6 overflow-x-auto"
            style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(51,65,85,0.8)', scrollbarWidth: 'none' }}
          >
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">{stats.labels.rides}</div>
              <div className="text-lg font-bold text-white">{stats.rides}</div>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">{stats.labels.distance}</div>
              <div className="text-lg font-bold text-white">{stats.totalKm.toLocaleString()} {stats.labels.km}</div>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">{stats.labels.elevation}</div>
              <div className="text-lg font-bold text-white">↑ {stats.totalElevationGain.toLocaleString()} m</div>
            </div>
            {stats.countries > 0 && (
              <>
                <div className="w-px h-8 bg-slate-700" />
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">{stats.labels.countries}</div>
                  <div className="text-lg font-bold text-white">{stats.countries}</div>
                </div>
              </>
            )}
            {stats.progress && (
              <>
                <div className="w-px h-8 bg-slate-700" />
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{stats.labels.americasCrossing}</div>
                  <div className="flex items-center gap-3">
                    <div className="w-28 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${stats.progress.pct}%`, background: '#22d3ee' }} />
                    </div>
                    <div className="text-sm font-bold text-cyan-400">{stats.progress.pct}%</div>
                  </div>
                </div>
                <div className="w-px h-8 bg-slate-700" />
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">{stats.labels.left}</div>
                  <div className="text-lg font-bold text-white">{stats.progress.kmLeft.toLocaleString()} {stats.labels.km}</div>
                </div>
              </>
            )}
          </div>
        )
      )}

      <SponsorBanner
        hidden={selectedTrip !== null || selectedRouteIndex !== null}
      />

      {mapVideoModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"
          onClick={() => setMapVideoModal(null)}
        >
          <div
            className="relative w-full max-w-4xl mx-4"
            onClick={e => e.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${mapVideoModal}?autoplay=1`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              className="w-full aspect-video rounded-xl"
            />
            <button
              onClick={() => setMapVideoModal(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white text-sm font-medium flex items-center gap-1.5"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
              Fermer
            </button>
          </div>
        </div>
      )}

      {currentTz && !(selectedTrip !== null || selectedRouteIndex !== null) && (
        <div
          className="absolute z-[1000] flex flex-col items-center px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900/85 backdrop-blur-sm"
          style={{ top: '71px', right: '16px' }}
        >
          <LocalTime tz={currentTz} lat={vincentLat} lng={vincentLng} />
        </div>
      )}

    </div>
  )
}
