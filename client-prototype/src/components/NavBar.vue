<template>
  <nav class="navbar">
    <div class="brand" @click="$router.push('/games')">Solaris: Command (Proto)</div>
    <div class="links">
      <router-link to="/games">Games</router-link>
      <router-link to="/profile">Profile</router-link>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  height: 60px;
  background: #333;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  justify-content: space-between;
}
.brand {
  font-weight: bold;
  font-size: 1.2rem;
  cursor: pointer;
  color: #4CAF50;
}
.links a {
  color: #ccc;
  text-decoration: none;
  margin-left: 1rem;
}
.links a.router-link-active {
  color: white;
  border-bottom: 2px solid #4CAF50;
}
</style>
