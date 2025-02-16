// Group image uploads.
function uploadGroupPic() { //* Expects groupID and groupPicPath variables in Vue data.
  if (this.groupID != -1) { //! Check a group is loaded. In other words, check groupID equals a number.
    return;
  }

  const formData = new FormData(document.getElementById("groupPicForm"));
  /* HTML code for the form:
  <img :src="groupPicPath" alt="Your group picture" id="groupPic" />

  <form id="groupPicForm">
    <input type="file" name="file" accept=".png, image/png"/>
    <input type="button" value="Upload Group Picture" v-on:click="uploadGroupPic()"/>
  </form>
  */

  let req = new XMLHttpRequest();
  req.onreadystatechange = () => {
    if (req.readyState === 4) {
      if (req.status === 200) {
        let picPath = 'images/group/' + this.groupID + '.png';
        this.groupPicPath = picPath;
      } else {
        alert("Image must be a png!");
      }
    }
  };
  let path = '/ajax/upload/group/' + this.groupID + '?t=' + new Date().getTime(); // Time as cache breaker to ensure file reloads.
  req.open('POST', path);
  req.send(formData);
}