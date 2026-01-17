// ===== Section toggle functions =====
function showAdd() {
  document.getElementById('profile-actions').style.display = 'none';
  document.getElementById('add-profile').style.display = 'block';
  document.getElementById('search-profile').style.display = 'none';
  document.getElementById('edit-profile').style.display = 'none';
  document.getElementById('add-name').value = '';
  document.getElementById('add-email').value = '';
  document.getElementById('add-interests').value = '';
}

function showSearch() {
  document.getElementById('profile-actions').style.display = 'none';
  document.getElementById('add-profile').style.display = 'none';
  document.getElementById('search-profile').style.display = 'block';
  document.getElementById('edit-profile').style.display = 'none';
  document.getElementById('search-userid').value = '';
}

function showEdit(user) {
  document.getElementById('profile-actions').style.display = 'none';
  document.getElementById('add-profile').style.display = 'none';
  document.getElementById('search-profile').style.display = 'none';
  document.getElementById('edit-profile').style.display = 'block';
  document.getElementById('edit-name').value = user.name || '';
  document.getElementById('edit-email').value = user.email || '';
  document.getElementById('edit-interests').value = user.interests || '';
  
  // Add timestamp to prevent caching
  document.getElementById('profile-img').src = `http://localhost:3000/profile-picture/${user.userid}?t=${Date.now()}`;
  
  localStorage.setItem('userid', user.userid);
}

// ===== API calls =====
async function handleAddProfile() {
  const payload = {
    name: document.getElementById('add-name').value,
    email: document.getElementById('add-email').value,
    interests: document.getElementById('add-interests').value
  };
  
  try {
    const res = await fetch('http://localhost:3000/add-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    const userid = data.user.userid;
    
    const imageInput = document.getElementById('add-image');
    if (imageInput.files.length > 0) {
      const formData = new FormData();
      formData.append('profileImage', imageInput.files[0]);
      
      await fetch(`http://localhost:3000/upload-picture/${userid}`, {
        method: 'POST',
        body: formData
      });
    }
    
    alert('Profile created! User ID: ' + userid);
    showEdit(data.user);
  } catch (err) {
    alert('Error adding profile: ' + err.message);
  }
}

async function handleDeleteProfile() {
  const userid = localStorage.getItem('userid');
  if (!userid) { alert('No profile loaded'); return; }
  
  if (!confirm('Are you sure you want to delete this profile?')) return;
  
  try {
    const res = await fetch(`http://localhost:3000/delete-profile/${userid}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    alert('Profile deleted!');
    localStorage.removeItem('userid');
    showHome();
  } catch (err) {
    alert('Error deleting profile: ' + err.message);
  }
}

function showHome() {
  document.getElementById('profile-actions').style.display = 'block';
  document.getElementById('add-profile').style.display = 'none';
  document.getElementById('search-profile').style.display = 'none';
  document.getElementById('edit-profile').style.display = 'none';
}

async function handleSearch() {
  const userid = document.getElementById('search-userid').value;
  if (!userid) { alert('Enter User ID'); return; }
  
  try {
    const res = await fetch(`http://localhost:3000/get-profile/${userid}`);
    if (res.status === 404) { alert('Profile not found'); return; }
    const user = await res.json();
    showEdit(user);
  } catch (err) {
    alert('Error fetching profile: ' + err.message);
  }
}

async function handleUpdateProfile() {
  const userid = localStorage.getItem('userid');
  if (!userid) { alert('No profile loaded'); return; }
  
  const payload = {
    userid: parseInt(userid),
    name: document.getElementById('edit-name').value,
    email: document.getElementById('edit-email').value,
    interests: document.getElementById('edit-interests').value
  };
  
  try {
    const res = await fetch('http://localhost:3000/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    alert('Profile updated!');
  } catch (err) {
    alert('Error updating profile: ' + err.message);
  }
}