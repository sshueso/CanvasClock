// JavaScript by Peter Hayes http://www.aphayes.pwp.blueyonder.co.uk/
// Copyright 2001-2010
// This code is made freely available but please keep this notice.
// I accept no liability for any errors in my coding but please
// let me know of any errors you find. My address is on my home page.

// The place definitions and function
// latitude is degrees:minutes:seconds, ns is 0 for north and 1 for south
// longitude is degrees:minutes:seconds, we is 0 for west and 1 for east
// zone is the correction in minutes from local time to UT (GMT) without daylight saving,
// west of Greenwich is positive.
// The daylight saving start and end (dss and dse) are strings month:week:day
// where month is 1:12, day is 0-6 (0=Sunday) and week is 1-5.
// week 1 is the first week containing 'day' and week 5 means the last occurence
// of day in the month (same as the Unix TZ rules).
// Set the string to a null string if you don't know the rules.
// Some sites taken from the stellarium database
// /Applications/Stellarium.app/Contents/Resources/data/cities_Earth.fab

function place(name,latitude,ns,longitude,we,zone,dss,dse) {
  this.name      = name;
  this.latitude  = latitude;
  this.ns        = ns;
  this.longitude = longitude;
  this.we        = we;
  this.zone      = zone;
  this.dss       = dss;
  this.dse       = dse;
}

// A selection of places

var atlas = new Array(
  
  
  new place("POP:Seattle","47:36:00",0,"122:19:00",0,480,"03:2:0","11:1:0"),
  new place("POP:New York","40:47:00",0,"73:58:00",0,300,"03:2:0","11:1:0"),
  new place("POP:San Jose","9:56:00",0,"84:5:00",0,360,"null","null")

  
);

// The observatory object holds local date and time,
// timezone correction in minutes with daylight saving if applicable,
// latitude and longitude  NOTE Meeus uses West positive for longitude and zone
// The IAU convention of East being positive was adopted in 1982
// we will use the IAU convention for options passed via the URL and convert

function observatory(place,now) {
  this.name = place.name;
  this.year = now.getFullYear();
  this.month = now.getMonth()+1;
  this.day = now.getDate();
  this.hours = now.getHours();
  this.minutes = now.getMinutes();
  this.seconds = now.getSeconds();
  this.tz = place.zone;
  this.latitude = parsecol(place.latitude); if (place.ns == 1) { this.latitude=-this.latitude; }
  this.longitude = parsecol(place.longitude); if (place.we == 1) { this.longitude=-this.longitude; }
}

// the actual observer
//var now = new Date();
//var observer  = new observatory(atlas[0],now);

// Site name returns name and latitude / longitude as a string

function sitename() {
  var sname=observer.name;
  var latd=Math.abs(observer.latitude);
  var latdi=Math.floor(latd);
  sname+=((latdi < 10) ? " 0" : " ") + latdi;
  latm=60*(latd-latdi); latmi=Math.floor(latm);
  sname+=((latmi < 10) ? ":0" : ":") + latmi;
  lats=60*(latm-latmi); latsi=Math.floor(lats);
  sname+=((latsi < 10) ? ":0" : ":") + latsi;
  sname+=((observer.latitude >= 0) ? "N " : "S ");
  var longd=Math.abs(observer.longitude);
  var longdi=Math.floor(longd);
  sname+=((longdi < 10) ? "0" : "") + longdi;
  longm=60*(longd-longdi); longmi=Math.floor(longm);
  sname+=((longmi < 10) ? ":0" : ":") + longmi;
  longs=60*(longm-longmi); longsi=Math.floor(longs);
  sname+=((longsi < 10) ? ":0" : ":") + longsi;
  sname+=((observer.longitude >= 0) ? "W" : "E");
  return sname;
}

// Check DST is an attempt to check daylight saving, its not perfect.
// Returns 0 or -60 that is amount to remove to get to zone time.

function checkdst(obs) {
  // We only know daylight saving if in the atlas
  with (document.table1) {
    if ((Place.selectedIndex < 0) || (Place.selectedIndex >= atlas.length))
      return 0;
    var dss=atlas[Place.selectedIndex].dss;
    var dse=atlas[Place.selectedIndex].dse;
    var ns=atlas[Place.selectedIndex].ns;
  }
  if (dss.length==0) return 0;
  if (dse.length==0) return 0;
  // parse the daylight saving start & end dates
  var col1=dss.indexOf(":");
  var col2=dss.lastIndexOf(":");
  var col3=dss.length;
  var dssm=parseInt(dss.substring(0,col1),10);
  var dssw=parseInt(dss.substring(col1+1,col2),10);
  var dssd=parseInt(dss.substring(col2+1,col3),10);
  col1=dse.indexOf(":");
  col2=dse.lastIndexOf(":");
  col3=dse.length;
  var dsem=parseInt(dse.substring(0,col1),10);
  var dsew=parseInt(dse.substring(col1+1,col2),10);
  var dsed=parseInt(dse.substring(col2+1,col3),10);
  // Length of months
  // year,month,day and day of week
  var jdt=jd0(obs.year,obs.month,obs.day);
  var ymd=jdtocd(jdt);
  // first day of month - we need to know day of week
  var fymd=jdtocd(jdt-ymd[2]+1);
  // look for daylight saving / summertime changes
  // first the simple month checks
  // Test for the northern hemisphere
  if (ns==0) {
    if ((ymd[1]>dssm) && (ymd[1]<dsem)) return -60;
    if ((ymd[1]<dssm) || (ymd[1]>dsem)) return 0;
  } else{
  // Southern hemisphere, New years day is summer.
    if ((ymd[1]>dssm) || (ymd[1]<dsem)) return -60;
    if ((ymd[1]<dssm) && (ymd[1]>dsem)) return 0;
  }
  // check if we are in month of change over
  if (ymd[1]==dssm) { // month of start of summer time
    // date of change over
    var ddd=dssd-fymd[3]+1;
    ddd=ddd+7*(dssw);
    while (ddd>month_length[ymd[1]-1]) ddd-=7;
    if (ymd[2]<ddd) return 0;
    // assume its past the change time, its impossible
    // to know if the change has occured.
    return -60;
  } 
  if (ymd[1]==dsem) { // month of end of summer time
    // date of change over
    var ddd=dsed-fymd[3]+1;
//    alert("first ddd="+ddd);
    ddd=ddd+7*(dsew);
//    alert("next ddd="+ddd);
    while (ddd>month_length[ymd[1]-1]) ddd-=7;
//    alert("last ddd="+ddd);
    if (ymd[2]<ddd) return -60;
    // see comment above for start time
    return 0;
  }
  return 0;
}

// The Julian date at observer time

function jd(obs) {
  var j = jd0(obs.year,obs.month,obs.day);
  j+=(obs.hours+((obs.minutes+obs.tz)/60.0)+(obs.seconds/3600.0))/24;
  return j;
}

// sidereal time in hours for observer

function local_sidereal(obs) {
  var res=g_sidereal(obs.year,obs.month,obs.day);
  res+=1.00273790935*(obs.hours+(obs.minutes+obs.tz+(obs.seconds/60.0))/60.0);
  res-=obs.longitude/15.0;
  while (res < 0) res+=24.0;
  while (res > 24) res-=24.0;
  return res;
}

// radtoaa converts ra and dec to altitude and azimuth

function radtoaa(ra,dec,obs) {
  var lst=local_sidereal(obs);
  var x=cosd(15.0*(lst-ra))*cosd(dec);
  var y=sind(15.0*(lst-ra))*cosd(dec);
  var z=sind(dec);
  // rotate so z is the local zenith
  var xhor=x*sind(obs.latitude)-z*cosd(obs.latitude);
  var yhor=y;
  var zhor=x*cosd(obs.latitude)+z*sind(obs.latitude);
  var azimuth=rev(atan2d(yhor,xhor)+180.0); // so 0 degrees is north
  var altitude=atan2d(zhor,Math.sqrt(xhor*xhor+yhor*yhor));
  return new Array(altitude,azimuth);
}

// aatorad converts alt and azimuth to ra and dec

function aatorad(alt,az,obs) {
  var lst=local_sidereal(obs)
  var lat=obs.latitude
  var j=sind(alt)*sind(lat)+cosd(alt)*cosd(lat)*cosd(az);
  var dec=asind(j);
  j=(sind(alt)-sind(lat)*sind(dec))/(cosd(lat)*cosd(dec));
  var s=acosd(j);
  j=sind(az);
  if (j>0) s=360-s;
  var ra=lst-s/15;
  if (ra<0) ra+=24;
  if (ra>=24) ra-=24;
  return new Array(ra,dec);
}

