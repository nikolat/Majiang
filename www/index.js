var player_names = [];
window.api.GetPlayerNames((name) => { // contextBridge
  if (player_names.length < 4) {//4人目はuserをオーバーライドする
    player_names.push(name);
    console.log('player' + player_names.length + ': ' + name);
  }
  else {
    console.log('定員オーバー: ' + name);
  }
});
