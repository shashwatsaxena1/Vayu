function login() {
  navigator.geolocation.getCurrentPosition(pos => {
    const user = {
      name: name.value,
      age: age.value,
      problem: problem.value,
      lat: pos.coords.latitude,
      lon: pos.coords.longitude
    };

    localStorage.setItem("user", JSON.stringify(user));
    window.location = "dashboard.html";
  });
}
