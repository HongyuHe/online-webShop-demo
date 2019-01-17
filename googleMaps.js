function initMap() {
  // The location of Amsterdam
  var amsterdam = {lat: 52.368, lng: 4.903};
  // The location of Warsaw
  var warsaw = {lat: 52.520, lng: 13.405};
  // The location of Berlin
  var berlin = {lat: 52.229, lng: 21.012};
  // The map, centered at Amsterdam
  var map = new google.maps.Map(
      document.getElementById('map'), {zoom: 4, center: amsterdam});
  // The marker, positioned at Amsterdam
  var markerAms = new google.maps.Marker({position: amsterdam, map: map});
  var markerWaw = new google.maps.Marker({position: warsaw, map: map});
  var markerBer = new google.maps.Marker({position: berlin, map: map});
}
