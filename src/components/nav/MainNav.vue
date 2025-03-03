<template>
  <div>
    <!-- watch page nav drawer is temporary, but causes layout shifting from hiding/unhiding -->
    <!-- create two different instances as a work around -->
    <NavDrawer
      v-model="navDrawer"
      :pages="pages"
      :temporary="isMobile || isWatchPage"
      :expand="navbarExpanded"
      @expand="navbarExpanded = !navbarExpanded"
    >
      <!-- <NavDrawer :pages="pages" v-model="drawer2" v-if="isMobile || isWatchPage"  -->
      <template v-if="isMobile">
        <!-- <InstallPrompt /> -->
        <user-card no-setting in-nav-drawer style="background-color: inherit" />
        <v-divider />
      </template>
    </NavDrawer>

    <!--* nav drawer is for the left --->
    <BottomNav v-if="isMobile" :pages="pages.filter((page) => !page.collapsible)" :active="!isWatchPage" />
    <!--* bottom bar --->

    <v-app-bar
      v-show="showTopBar"
      id="top-bar"
      :class="{
        'secondary darken-1': darkMode,
        'primary lighten-1': !darkMode,
      }"
      :app="showTopBar"
      clipped-left
      clipped-right
      flat
      extension-height="36"
      height="56"
    >
      <!--=============================== Top Bar (Regular View) =============================-->

      <template v-if="!isMobile || (isMobile && !searchBarExpanded)">
        <!--================= Logo & Search Bar (Space permitting) ================-->

        <v-app-bar-nav-icon @click.stop="navDrawer = !navDrawer; navbarExpanded = false">
          <v-icon>{{ icons.mdiMenu }}</v-icon>
        </v-app-bar-nav-icon>
        <v-toolbar-title style="overflow: visible" :class="{ 'pa-0': isMobile }">
          <router-link :to="{ name: $store.state.settings.defaultOpen || '/' }">
            <Logo
              v-if="!isMobile"
              width="24"
              height="24"
              style="margin-bottom: -4px"
            />
          </router-link>
          <OrgSelector />
        </v-toolbar-title>
        <SearchBar v-if="!isMobile" key="main-search-bar" />

        <!--================= Account [👤] Button (Desktop Only) ================-->

        <ResponsiveMenu
          :close-on-content-click="false"
          offset-y
          :item-count="$store.state.playlist.active.videos.length || 0"
          content-class="main-playlist-border"
        >
          <template #activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              icon
              :class="{ 'ml-auto': isMobile }"
              v-on="on"
            >
              <v-icon>{{ icons.mdiPlaylistPlay }}</v-icon>
            </v-btn>
          </template>
          <edit-playlist>
            <div class="pt-2 pl-2">
              <span class="text-overline secondary--text">Current Playlist</span>&emsp;
              <router-link to="/playlists" class="text-caption">
                (more)
              </router-link>
            </div>
          </edit-playlist>
        </ResponsiveMenu>
        <v-menu
          v-if="!isMobile"
          left
          offset-y
          transition="slide-y-transition"
        >
          <template #activator="{ on, attrs }">
            <v-btn
              icon
              v-bind="attrs"
              class="ml-2"
              v-on="on"
            >
              <v-icon v-if="!($store.state.userdata && $store.state.userdata.user)">
                {{ icons.mdiAccountCircleOutline }}
              </v-icon>
              <v-avatar v-else size="40">
                <img
                  :src="`https://avatars.dicebear.com/api/jdenticon/${$store.state.userdata.user.id}.svg`"
                  alt="Avatar generated by your user ID"
                >
              </v-avatar>
            </v-btn>
          </template>

          <!------- USER CARD ------->
          <user-card />
          <!------- END USER CARD ------->
        </v-menu>

        <!--================= Search [🔍] Button (Mobile Only) ================-->

        <v-btn v-if="isMobile" icon @click="searchBarExpanded = true">
          <v-icon>{{ icons.mdiMagnify }}</v-icon>
        </v-btn>
      </template>

      <!--=========================== END OF Regular View ===========================-->

      <!--===================== Expanded Search Bar (Mobile Only) =======================-->

      <template v-else>
        <v-app-bar-nav-icon class="backButton" @click="searchBarExpanded = false">
          <v-icon>{{ icons.mdiClose }}</v-icon>
        </v-app-bar-nav-icon>
        <SearchBar key="main-search-bar" :autofocus="isMobile" />
      </template>

      <!--=================== END OF Expanded Search (Mobile Only) =======================-->
      <div
        :class="{
          'secondary darken-3': darkMode,
          'primary lighten-1': !darkMode,
        }"
        style="
                    position: absolute;
                    top: calc(-1 * env(safe-area-inset-top));
                    left: 0px;
                    right: 0px;
                    width: 100%;
                    height: env(safe-area-inset-top);
                    z-index: 300;
                "
      >
        <!-- this is just the element that covers up the notch. don't worry about it. -->
      </div>

      <!-- Extension Slot for mobile v-tabs -->
      <!-- Disable onScroll when ext is disabled. onScroll hooks on to window, so it can live anywhere -->
      <span v-if="!disableExt" v-scroll="onScroll" />
      <template v-if="!disableExt" #extension>
        <v-slide-y-transition>
          <!-- v-tabs are teleported here from their respective view -->
          <portal-target v-if="showExt" name="mainNavExt" slim />
        </v-slide-y-transition>
      </template>
    </v-app-bar>
  </div>
</template>

<script lang="ts">
import SearchBar from "@/components/common/SearchBar.vue";
import Logo from "@/components/common/Logo.vue";
import OrgSelector from "@/components/common/OrgSelector.vue";
import UserCard from "@/components/user/UserCard.vue";
import { mapState } from "vuex";
import hideExtensionOnScroll from "@/mixins/hideExtensionOnScroll";
import EditPlaylist from "@/components/playlist/EditPlaylist.vue";
import ResponsiveMenu from "@/components/common/ResponsiveMenu.vue";
import { musicdexURL } from "@/utils/consts";
import querystring from "querystring";
import NavDrawer from "./NavDrawer.vue";
import BottomNav from "./BottomNav.vue";

export default {
    components: {
        SearchBar,
        NavDrawer,
        BottomNav,
        UserCard,
        Logo,
        // InstallPrompt,
        OrgSelector,
        EditPlaylist,
        ResponsiveMenu,
    },
    mixins: [hideExtensionOnScroll],
    data() {
        return {
            favoritesExpanded: false,
            searchBarExpanded: false,
            navbarExpanded: false,
        };
    },
    computed: {
        showTopBar() {
            if (this.isMultiView) return false;
            if (this.isMobile && this.isWatchPage) {
                return false;
            }
            if (this.$route.name === "tlclient" || this.$route.name === "scripteditor") {
                return false;
            }
            return true;
        },
        isMobile() {
            return this.$store.state.isMobile;
        },
        darkMode() {
            return this.$store.state.settings.darkMode;
        },
        isWatchPage() {
            return ["watch_id", "watch", "edit_video", "multiview", "tlclient", "scripteditor"].includes(this.$route.name);
        },
        isMultiView() {
            return this.$route.name === "multiview";
        },
        navDrawer: {
            get() {
                return this.$store.state.navDrawer;
            },
            set(val) {
                return this.$store.commit("setNavDrawer", val);
            },
        },
        pages() {
            const org_qs = querystring.stringify({ org: this.$store.state.currentOrg.name });

            return [
                {
                    name: this.$t("component.mainNav.home"),
                    path: "/",
                    icon: this.icons.mdiHome,
                },
                {
                    name: this.$t("component.mainNav.favorites"),
                    path: "/favorites",
                    icon: this.icons.mdiHeart,
                },
                {
                    name: this.$t("component.mainNav.channels"),
                    path: `/channel?${org_qs}`,
                    icon: this.icons.mdiAccountBoxMultiple,
                },
                {
                    name: this.$t("component.mainNav.playlist"),
                    path: "/playlists",
                    icon: this.icons.mdiPlaylistPlay,
                    divider: true,
                },
                {
                    name: this.$t("component.mainNav.multiview"),
                    path: "/multiview",
                    icon: this.icons.mdiViewDashboard,
                    collapsible: true,
                },
                {
                    name: "Musicdex",
                    path: musicdexURL,
                    // icon: this.icons.mdiMusic,
                    collapsible: true,
                    divider: true,
                },
                {
                    name: this.$t("component.mainNav.about"),
                    path: "/about",
                    icon: this.icons.mdiHelpCircle,
                    collapsible: true,
                },
                {
                    name: this.$t("component.mainNav.settings"),
                    path: "/settings",
                    icon: this.icons.mdiCog,
                    collapsible: true,
                },
                {
                    name: "TL client",
                    path: "/tlclient",
                    icon: this.icons.mdiTypewriter,
                    collapsible: true,
                    extra: true,
                },
                {
                    name: "Script Editor",
                    path: "/scripteditor",
                    icon: this.icons.mdiNoteEdit,
                    collapsible: true,
                    extra: true,
                },
                {
                    name: "Script Manager",
                    path: "/scriptmanager",
                    icon: this.icons.mdiFileDocumentMultiple,
                    collapsible: true,
                    extra: true,
                },
                {
                    name: "Relay Bot Setting",
                    path: "/relaybot",
                    icon: this.icons.mdiRobot,
                    collapsible: true,
                    extra: true,
                },
            ];
        },
        ...mapState(["firstVisit", "showOrgTip"]),
    },
    watch: {
        // toggle navdrawer when navigating between watch pages on desktop
        isWatchPage() {
            if (this.isMobile) return;
            this.navDrawer = !this.isWatchPage;
        },
        // if user is flipping between mobile/desktop breakpoints, keep navdrawer closed
        isMobile() {
            this.navDrawer = false;
        },
    },
    created() {
        const vm = this;
        if (this.$store.state.showOrgTip) {
            setTimeout(() => {
                vm.$store.commit("setOrgTip");
            }, 20000);
        }
        if (this.$store.state.firstVisit) {
            setTimeout(() => {
                vm.$store.commit("setVisited");
            }, 30000);
        }

        // always pop out nav drawer if it's not watch page or collapsed
        if (
            !window.location.pathname.match("^/watch|^/multiview|^/infinite")
            && !this.isMobile
            && !this.$vuetify.breakpoint.md
        ) {
            this.navDrawer = true;
        }
    },
};
</script>

<style scoped>
@keyframes rotation {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(359deg);
    }
}

#top-bar {
    /* background-color: #2b79ad !important; */
    padding-left: min(calc(env(safe-area-inset-left)), 30px);
    padding-right: min(calc(env(safe-area-inset-right)), 30px);
    /* padding-top: min(calc(env(safe-area-inset-top) / 2), 30px); */
    /* height: calc(env(safe-area-inset-top,0px) + 30px); */
    padding-top: 0px;
    margin-top: env(safe-area-inset-top, 0px) !important;
}
#top-bar.v-toolbar--extended {
    height: 56px !important;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}
.fade-enter,
.fade-leave-to {
    opacity: 0;
}

.main-playlist-border {
    border: 2px solid var(--v-primary-base);
    border-radius: 8px;
}
.theme--dark .main-playlist-border {
    box-shadow: 0px 6px 12px -7px var(--v-primary-darken2);
}
.theme--light .main-playlist-border {
    box-shadow: 0px 6px 12px -7px var(--v-primary-lighten2);
}
</style>
