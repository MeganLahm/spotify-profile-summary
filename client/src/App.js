import React, { Component } from "react";
import "./App.css";
import SpotifyWebApi from "spotify-web-api-js";
import AlbumArt from "./AlbumArt";

const spotifyApi = new SpotifyWebApi();

class App extends Component {
  constructor() {
    super();
    const params = this.getHashParams();
    const token = params.access_token;
    const prof = params.user;
    if (token) {
      spotifyApi.setAccessToken(token);
      this.getNowPlaying();
      this.getTopStats();
    }
    this.state = {
      loggedIn: token ? true : false,
      nowPlaying: { uri: "", name: "Not Playing", albumArt: "" },
      user: prof,
      paused: "",
      artists: [],
      tracks: []
    };
  }
  getHashParams() {
    var hashParams = {};
    var e,
      r = /([^&;=]+)=?([^&;]*)/g,
      q = window.location.hash.substring(1),
      e = r.exec(q);
    while (e) {
      hashParams[e[1]] = decodeURIComponent(e[2]);
      e = r.exec(q);
    }
    return hashParams;
  }

  async getNowPlaying() {
    this.updateProfile();
    await spotifyApi.getMyCurrentPlaybackState().then(response => {
      response.item &&
        this.setState({
          nowPlaying: {
            name: response.item.name,
            albumArt: response.item.album.images[0].url,
            artist: response.item.artists[0].name,
            paused: response.is_playing,
            uri: response.item.uri
          }
        });
      console.log(response);
    });
  }

  async skipSong() {
    await spotifyApi.skipToNext();
    await this.getNowPlaying();
  }

  async prevSong() {
    await spotifyApi.skipToPrevious();
    await this.getNowPlaying();
  }

  async playPause() {
    await this.getNowPlaying();
    if (this.state.paused) {
      await spotifyApi.play();
    } else {
      await spotifyApi.pause();
    }
    this.setState({
      paused: !this.state.paused
    });
    await this.getNowPlaying();
  }

  async updateProfile() {
    const token = spotifyApi.getAccessToken();
    let response = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: "Bearer " + token
      }
    });
    let profile = await response.json();
    this.setState({
      user: profile
    });
  }

  async createAlbumPlaylist() {
    const token = spotifyApi.getAccessToken();
    let data = {
      name: "Playlist:" + this.state.nowPlaying.name,
      public: false
    };
    let response = await fetch(
      "https://api.spotify.com/v1/users/" + this.state.user.id + "/playlists",
      {
        method: "post",
        headers: {
          Authorization: "Bearer " + token
        },
        body: JSON.stringify(data)
      }
    );
    let res = await response.json();
    console.log("RESPONSE:", res);
    console.log("STATE:", this.state);
    let response2 = await fetch(
      "https://api.spotify.com/v1/playlists/" + res.id + "/tracks",
      {
        method: "post",
        headers: {
          Authorization: "Bearer " + token,
          Accept: "application/json"
        },
        body: JSON.stringify({
          uris: [this.state.nowPlaying.uri]
        })
      }
    );
    let res2 = await response2.json();
    console.log("RESPONSE:", res2);
  }

  async getTopStats() {
    //Get the top artists & tracks
    let artistsRequest = await spotifyApi.getMyTopArtists();
    this.setState({ artists: artistsRequest.items });

    //Get the top tracks
    let tracksRequest = await spotifyApi.getMyTopTracks();
    this.setState({ tracks: tracksRequest.items });

    console.log("State tracks:", this.state.tracks);
    console.log("State artists:", this.state.artists);
  }

  render() {
    return (
      <div className="App">
        {!this.state.loggedIn ? (
          <a href="http://localhost:8888"> Login to Spotify </a>
        ) : (
          <>
            <div>
              {this.state.user ? (
                <>
                  <img
                    src={this.state.user.images[0].url}
                    style={{ height: 100 }}
                  />
                  <div>User: {this.state.user.display_name}</div>
                  <div>Email: {this.state.user.email}</div>
                </>
              ) : null}
            </div>
            <AlbumArt
              height={500}
              albumArt={this.state.nowPlaying.albumArt}
              subtitle={
                "Now Playing: " +
                this.state.nowPlaying.name +
                " by " +
                this.state.nowPlaying.artist
              }
              classStyle="playingArt"
            />

            <>
              <button onClick={() => this.prevSong()}>Previous song</button>
              {this.state.paused ? (
                <button onClick={() => this.playPause()}>Play</button>
              ) : (
                <button onClick={() => this.playPause()}>Pause</button>
              )}
              {/* create some way to sense song is finished */}
              <button onClick={() => this.skipSong()}>Skip song</button>
            </>
            <button onClick={() => this.createAlbumPlaylist()}>
              Make Playlist from song
            </button>
            <div>Top Artists:</div>
            <div className="container">
              {this.state.artists &&
                this.state.artists.map(artist => (
                  <AlbumArt
                    key={artist.name}
                    height={150}
                    albumArt={artist.images[0].url}
                    subtitle={artist.name}
                    classStyle="albumArt"
                  />
                ))}
            </div>
            <div>Top Songs:</div>
            <div className="container">
              {this.state.tracks &&
                this.state.tracks.map(track => (
                  <AlbumArt
                    key={track.name}
                    height={150}
                    albumArt={track.album.images[0].url}
                    subtitle={track.name + " by " + track.artists[0].name}
                    classStyle="albumArt"
                  />
                ))}
            </div>
          </>
        )}
      </div>
    );
  }
}
export default App;
